from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from schemas.topic import Topic
from models import get_openrouter_llm

class SubmitCurriculumArgs(BaseModel):
    curriculum: Topic = Field(..., description="The complete curriculum.")

@tool(args_schema=SubmitCurriculumArgs)
def submit_curriculum(curriculum: Topic) -> str:
    """Submit the generated curriculum to the user for review. You MUST call this tool when you have finished creating or refining the curriculum."""
    return "Curriculum submitted."

SYSTEM_PROMPT = """You are an expert curriculum designer and educational planner with access to the internet.
Your task is to structure a comprehensive learning Topic based on the user's input.
Use the search tool to research the topic and build an accurate, high-quality curriculum.
Once you have formulated the curriculum, you MUST use the `submit_curriculum` tool to present it to the user.
If the user provides refinement instructions, incorporate them and call `submit_curriculum` again with the updated curriculum."""

CREATE_TOPIC_INPUT_TEMPLATE = """Create a new learning curriculum.
User Information:
- Name/Topic: {name}
- Description: {description}
- Familiarity Level: {familiarity_level}
- Additional Info: {additional_info}

Create a detailed curriculum with lessons and modules. Ensure you fill out the teaching_style and persona.
"""

# Global checkpointer so memory persists across API requests
checkpointer = InMemorySaver()

class TopicPlanner:
    def __init__(self):
        self.search_tool = TavilySearchResults()
        self.tools = [self.search_tool, submit_curriculum]
        
        self.middleware = HumanInTheLoopMiddleware(interrupt_on={"submit_curriculum": True})
        
        self.agent = create_agent(
            model=get_openrouter_llm(),
            tools=self.tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer,
            middleware=[self.middleware]
        )

    async def create_topic(self, thread_id: str, name: str, description: str, familiarity_level: str, additional_info: str) -> Topic:
        input_task = CREATE_TOPIC_INPUT_TEMPLATE.format(
            name=name,
            description=description,
            familiarity_level=familiarity_level,
            additional_info=additional_info
        )

        config = {"configurable": {"thread_id": thread_id}}
        state = await self.agent.ainvoke({
            "messages": [("user", input_task)]
        }, config=config)
        
        # Extract the structured response from the tool call
        last_message = state["messages"][-1]
        
        if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
            raise ValueError("Agent did not call submit_curriculum tool.")
            
        tool_call = last_message.tool_calls[0]
        curriculum_dict = tool_call["args"]["curriculum"]
        return Topic(**curriculum_dict)

    async def refine_topic(self, thread_id: str, refine_instruction: str) -> Topic:
        config = {"configurable": {"thread_id": thread_id}}
        
        # Resume the agent with the user's refinement feedback
        state = await self.agent.ainvoke(Command(resume=refine_instruction), config=config)
        
        last_message = state["messages"][-1]
        
        if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
            raise ValueError("Agent did not call submit_curriculum tool after refinement.")
            
        tool_call = last_message.tool_calls[0]
        curriculum_dict = tool_call["args"]["curriculum"]
        return Topic(**curriculum_dict)
