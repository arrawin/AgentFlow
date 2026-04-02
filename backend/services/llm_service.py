import requests
import os
import json

PROVIDER_URLS = {
    "groq":      "https://api.groq.com/openai/v1/chat/completions",
    "openai":    "https://api.openai.com/v1/chat/completions",
    "anthropic": "https://api.anthropic.com/v1/messages",
    "gemini":    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "ollama":    "http://localhost:11434/v1/chat/completions",
}


class LLMService:
    def __init__(self, llm_config=None):
        if llm_config:
            from services.encryption_service import EncryptionService
            enc = EncryptionService()
            self.api_key = enc.decrypt(llm_config.api_key_encrypted)
            self.provider = llm_config.provider.lower()
            self.model = llm_config.model
            self.base_url = self._resolve_url(llm_config.base_url or PROVIDER_URLS.get(self.provider))
            self.temperature = llm_config.temperature or 0.7
            self.max_tokens = llm_config.max_tokens or 2048
        else:
            self.api_key = os.getenv("GROQ_API_KEY")
            self.provider = "groq"
            self.model = "llama-3.3-70b-versatile"   # better tool calling than 8b
            self.base_url = PROVIDER_URLS["groq"]
            self.temperature = 0.7
            self.max_tokens = 4096

        if not self.api_key:
            print(f"WARNING: No API key for provider '{self.provider}'")

    @staticmethod
    def _resolve_url(url: str) -> str:
        if not url:
            return url
        import re
        return re.sub(r'(https?://)localhost\b', r'\1host.docker.internal', url)

    def generate(self, prompt: str) -> str:
        """Simple text generation - no tools."""
        if not self.api_key:
            return f"Error: No API key configured for provider '{self.provider}'"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        try:
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()
            print(f"\nLLM RAW RESPONSE [{self.provider}/{self.model}]:")
            print(data)
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error calling LLM API ({self.provider}): {e}")
            return None

    def generate_with_tools(self, messages: list, tools: list) -> dict:
        """
        Native function calling via OpenAI-compatible API.
        Returns the full message object so caller can handle tool_calls.

        tools format: [{"name": "web_search", "description": "...", "parameters": {...}}]
        """
        if not self.api_key:
            return {"role": "assistant", "content": f"Error: No API key for '{self.provider}'"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Convert to OpenAI tool format
        openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t.get("parameters", {
                        "type": "object",
                        "properties": {},
                        "required": []
                    })
                }
            }
            for t in tools
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "tools": openai_tools,
            "tool_choice": "auto",
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        try:
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()
            print(f"\nLLM TOOL RESPONSE [{self.provider}/{self.model}]:")
            print(data)
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]
            return {"role": "assistant", "content": "Error: no response"}
        except requests.exceptions.RequestException as e:
            print(f"Error calling LLM API ({self.provider}): {e}")
            return {"role": "assistant", "content": f"Error: {str(e)}"}
