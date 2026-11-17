import os
from typing import Annotated, Literal

from langchain_core.messages import (
    BaseMessage, HumanMessage, SystemMessage, ToolMessage
)
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import (
    StateGraph, START, END
)
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_tavily import TavilySearch
from langgraph.types import interrupt
from pydantic import BaseModel, Field

from agents.topic_curriculum_planner.prompts import SYSTEM_PROMPT
from core.config import settings
from models import get_openrouter_llm
from schemas.topic import Topic

search_tool = TavilySearch(
    max_results=5,
    include_image_descriptions=True,
    search_depth="basic",
    include_usage=True
)

llm = get_openrouter_llm(model_name=os.environ.get("OPENROUTER_MODEL", "openrouter/free"))


class TopicState(BaseModel):
    """Represents the state of the Topic Planner agent."""

    messages: Annotated[list[BaseMessage], add_messages] = Field(
        default_factory=lambda: [SystemMessage(content=SYSTEM_PROMPT)], description="A list of agent messages"
    )
    done: bool = Field(default=False, description="Flag for whether the generation is done or not.")
    current_response: Topic | None = Field(default=None, description="Currently generated topic response.")


class TopicInterruptResponse(BaseModel):
    """
    Represents interrupt response of the user, during subsequent generation steps.
    """

    satisfied: bool = Field(default=False, description="Flag representing whether the user is satisfied or not.")
    feedback: str = Field(..., description="User's feedback on currently generated curriculum.")


def topic_generator(state: TopicState):
    """Generates the actual topic curriculum based on the user specified requirements."""

    tools_llm = llm.bind_tools([search_tool], tool_choice="auto")
    generator_llm = llm.with_structured_output(Topic, include_raw=True)

    last_message = state.messages[-1]
    if isinstance(last_message, ToolMessage) and last_message.name == "tavily_search":
        output = generator_llm.invoke(state.messages)
        return {
            "messages": [output.get("raw")], # type: ignore
            "current_response": output.get("parsed") # type: ignore
        }
    response = tools_llm.invoke(state.messages)
    # Handling a failure case when the tools LLM hasn't generated any tool call
    if not response.tool_calls:
        output = generator_llm.invoke(state.messages)
        return {
            "messages": [output.get("raw")], # type: ignore
            "current_response": output.get("parsed") # type: ignore
        }
    return {
        "messages": [response]
    }


def handle_human_feedback(state: TopicState):
    """It handles user interrupt and feedback."""

    resp = interrupt(
        value="Are you satistied with the curriculum? Please provide your feedback.",
        response_schema=TopicInterruptResponse
    )
    if resp.satisfied:
        return {
            "done": True
        }
    return {
        "messages": [HumanMessage(content=resp.feedback)]
    }


def generator_tool_edges(state: TopicState) -> Literal["search_tool", "feedback"]:
    """
    Routes the graph execution to appropriate nodes based on the type and
    attributes of last message.
    """

    last_message = state.messages[-1]
    tool_names = [c["name"] for c in last_message.tool_calls]
    if "tavily_search" in tool_names:
        return "search_tool"
    return "feedback"


def human_feedback_edge(state: TopicState) -> Literal["generator", "end"]:
    """
    Routes the graph execution to end if user is satisfied otherwise again to the
    generator.
    """

    if state.done:
        return "end"
    return "generator"


def build_topic_planner(with_checkpointer=True, compile=True):
    """Builds the final state graph agent."""
    checkpointer = None
    if with_checkpointer and not os.environ.get("LANGGRAPH_STUDIO") == "true":
        checkpointer = InMemorySaver()

    graph = StateGraph(state_schema=TopicState)
    # Adding nodes
    graph.add_node("generator", topic_generator)
    graph.add_node("tools", ToolNode([search_tool]))
    graph.add_node("feedback", handle_human_feedback)

    # Adding edges
    graph.add_edge(START, "generator")
    graph.add_conditional_edges("generator", generator_tool_edges,
        path_map={
            "search_tool": "tools",
            "feedback": "feedback"
        }
    )
    graph.add_edge("tools", "generator")
    graph.add_conditional_edges("feedback", human_feedback_edge,
        path_map={
            "generator": "generator",
            "end": END
        }
    )
    if compile:
        final_graph = graph.compile(
            checkpointer=checkpointer,
            name="topic_planner"
        )
        return final_graph
    return graph

topic_planner = build_topic_planner()
