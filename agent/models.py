import os
from langchain_openrouter import ChatOpenRouter

def get_openrouter_llm(
    model_name: str = "deepseek/deepseek-chat",
    temperature: float = 0.2
):
    """
    Returns an LLM configured for OpenRouter using the langchain-openrouter package.
    Gemini Flash 1.5 is chosen for its fast speed, cheap token costs, and excellent 
    research/context capabilities.
    """
    return  ChatOpenRouter(
        model=model_name,
        temperature=temperature
    )
