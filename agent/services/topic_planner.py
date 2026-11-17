from langchain.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command

from agents.topic_curriculum_planner import topic_planner, TopicState
from agents.topic_curriculum_planner.prompts import CREATE_TOPIC_INPUT_TEMPLATE
from schemas.topic import Topic


class TopicPlanner:
    """
    Handles topic planner agent's lifecycle for topic curriculum generation.
    """
    def __init__(self, thread_id):
        self._thread_id = thread_id
        self.config: RunnableConfig = {
            "configurable": {
                "thread_id": thread_id
            }
        }

    def _check_for_interrupt(self):
        state_snapshot = topic_planner.get_state(self.config) # type: ignore
        if state_snapshot and not state_snapshot.next:
            raise ValueError("Invalid resume operation. No generated topic state exists.")

    async def generate(
        self, name: str, desc: str, familiarity_level: str, additional_info: str | None=None
    ) -> Topic:
        """
        Generates  a new topic with user's preferences.

        Args:
            name: name of the topic
            desc: full description of the topic
            familiarity_level: the user's current familarity level with the topic
            additional_info: any other info user wants to provide.
        """
        final_data = {
            "name": name,
            "description": desc,
            "familiarity_level": familiarity_level,
            "additional_info": additional_info
        }
        final_prompt = CREATE_TOPIC_INPUT_TEMPLATE.format(**final_data)

        final_state = await topic_planner.ainvoke( # type: ignore
            TopicState(messages=[HumanMessage(content=final_prompt)]),
            config=self.config
        )
        return final_state["current_response"]

    async def incorporate_feedback(self, feedback: str="No any") -> Topic:
        """
        Resumes the topic generation with user's feedback or completely
        finalizes it.

        Args:
            feedback: the user's feedback to be incorporated
            satisfied: whether the generation is over and user is satisfied

        Returns:
            Returns the final topic
        """
        self._check_for_interrupt()
        final_state = await topic_planner.ainvoke( # type: ignore
            Command(
                resume={
                    "satisfied": False,
                    "feedback": feedback
                }
            ), config=self.config
        )
        return final_state["current_response"]

    async def finish(self):
        """Finishes the generation of curriculum and ends the thread."""
        self._check_for_interrupt()
        await topic_planner.ainvoke( # type: ignore
            Command(
                resume={
                    "satisfied": True,
                    "feedback": "No any"
                }
            ), config=self.config
        )
