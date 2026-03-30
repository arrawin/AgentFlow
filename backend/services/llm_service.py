import requests
import os

# Provider → base URL mapping
PROVIDER_URLS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "openai": "https://api.openai.com/v1/chat/completions",
    "anthropic": "https://api.anthropic.com/v1/messages",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "ollama": "http://localhost:11434/v1/chat/completions",
}

DEFAULT_MODELS = {
    "groq": "llama-3.1-8b-instant",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-haiku-20240307",
    "gemini": "gemini-1.5-flash",
    "ollama": "llama3",
}


class LLMService:
    def __init__(self, llm_config=None):
        """
        llm_config: optional LLMConfig DB model instance.
        If not provided, falls back to Groq via GROQ_API_KEY env var.
        """
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
            # Default: Groq
            self.api_key = os.getenv("GROQ_API_KEY")
            self.provider = "groq"
            self.model = "llama-3.1-8b-instant"
            self.base_url = PROVIDER_URLS["groq"]
            self.temperature = 0.7
            self.max_tokens = 2048

        if not self.api_key:
            print(f"WARNING: No API key for provider '{self.provider}'")

    @staticmethod
    def _resolve_url(url: str) -> str:
        """Rewrite localhost to host.docker.internal so user-provided URLs work from inside Docker."""
        if not url:
            return url
        import re
        return re.sub(r'(https?://)localhost\b', r'\1host.docker.internal', url)

    def generate(self, prompt: str) -> str:
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
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()

            print(f"\nLLM RAW RESPONSE [{self.provider}/{self.model}]:")
            print(data)

            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            else:
                print("Error: Unexpected response format")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Error calling LLM API ({self.provider}): {e}")
            return None
