import requests
import os


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            print("WARNING: GROQ_API_KEY not set in environment")

    def generate(self, prompt: str):
        if not self.api_key:
            return "Error: GROQ_API_KEY not configured"
            
        url = "https://api.groq.com/openai/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            print("\nLLM RAW RESPONSE:")
            print(data)
            
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            else:
                print("Error: Unexpected response format")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Error calling LLM API: {e}")
            return None

        return data["choices"][0]["message"]["content"]