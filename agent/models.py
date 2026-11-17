import os
from langchain_openrouter import ChatOpenRouter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
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

def get_google_llm(
    model_name: str = "gemini-1.5-flash",
    temperature: float = 0.2
):
    """
    Returns an LLM configured for Google GenAI using the langchain-google-genai package.
    """
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature
    )


def get_groq_llm(
    model_name: str,
    temperature: float = 0.2
):
    """
    Returns an LLM provided by Groq platform.
    """
    return ChatGroq(
        model=model_name,
        temperature=temperature
    )
