import requests
import os

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def tavily_search(query: str):
    url = "https://api.tavily.com/search"

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 5
    }

    response = requests.post(url, json=payload)

    if response.status_code != 200:
       print("TAVILY ERROR RESPONSE:", response.text)
       return f"Error: Tavily API failed ({response.status_code})"

    data = response.json()

    # Extract useful info
    results = data.get("results", [])

    formatted = []

    for r in results:
        title = r.get("title", "")
        content = r.get("content", "")
        formatted.append(f"{title}: {content}")

    return "\n\n".join(formatted)