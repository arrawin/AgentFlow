from services.llm_service import LLMService


def count_tokens_approx(text: str) -> int:
    """Rough token estimate — 1 token ≈ 4 chars."""
    return len(text) // 4


def summarise_if_long(output: str, llm_config=None, threshold: int = 1500) -> str:
    """
    If output exceeds threshold tokens, summarise it using the LLM.
    Returns the original output if short enough, or a summary if too long.
    """
    if not output or count_tokens_approx(output) <= threshold:
        return output

    try:
        llm = LLMService(llm_config=llm_config)
        prompt = f"""Summarise the following content concisely, preserving all key facts, data, names, dates and numbers. Keep it under 400 words.

Content:
{output[:8000]}

Summary:"""
        summary = llm.generate(prompt)
        if summary:
            return f"[Summarised] {summary}"
    except Exception as e:
        print(f"[summariser] Failed to summarise: {e}")

    # Fallback — truncate
    return output[:3000] + "\n...[truncated]"
