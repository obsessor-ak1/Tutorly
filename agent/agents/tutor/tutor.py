import asyncio
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.runtime import Runtime
from langgraph.types import interrupt

from agents.tutor.state_schema import (
    ExplainerTask,
    TutorState,
    ResourceReviewNodeState,
    SelectedSources,
    AITutorResponse,
    UserFollowup,
    InterruptSpec
)
from agents.tutor.tools import search_sources
from agents.tutor.prompts import (
    JUDGE_TASK_PROMPT
)
from agents.tutor.subagents.gatherer import gatherer
from agents.tutor.subagents.note_taker.note import note_taker
from agents.tutor.subagents.assessor.assessment import assessor
from agents.utils.store import PineconeStoreManager
from models import get_google_llm
from repository import update_lesson_progress

llm = get_google_llm(model_name="gemini-2.5-flash")


async def gathering_start(state: TutorState):
    """Calls the resource gatherer agent."""
    init_state = {
        "familiarity_level": state.familiarity_level,
        "topic_description": state.topic_description,
        "lesson": state.lesson,
        "user_remarks": state.user_remarks
    }
    gatherer_state = await gatherer.ainvoke(init_state) # type: ignore
    resources = gatherer_state["resources"]
    return {
        "resources": resources
    }


async def user_review_and_ingest(
    private_state: ResourceReviewNodeState, runtime: Runtime
):
    """
    It interrupts the graph for user's review of resources and then
    ingests the marked ones.
    """
    resources = private_state.resources
    responses = interrupt(
        InterruptSpec(
            int_type="review",
            int_info="Please select among the given resources."
        ),
        response_schema=SelectedSources
    )
    print(responses)
    final_resource_list = responses.sources
    try:
        selected_resources = {
            selected_source: resources[selected_source]
            for selected_source in final_resource_list
        }
    except KeyError:
        raise ValueError("Invalid resource URL selected")

    thread_id = runtime.execution_info.thread_id # type: ignore
    store_mgr = PineconeStoreManager(thread_id) # type: ignore
    store_tasks = [
        store_mgr.add_source(src, val["content"]) # type: ignore
        for src, val in selected_resources.items()
    ]
    await asyncio.gather(*store_tasks)
    return dict()


async def explainer(state: TutorState):
    """
    Explains the concepts to the user, module by module and
    responds to the user's queries.
    """

    explainer_llm = llm.bind_tools([search_sources])
    prompt = state.current_task.get_task_prompt(state.lesson) # type: ignore
    sys_instruction = SystemMessage(content=state.explainer_system_prompt)
    instruction = HumanMessage(content=prompt)
    message = await explainer_llm.ainvoke(
        [sys_instruction] + state.messages + [instruction]
    )
    interaction = [instruction, message]
    return {
        "messages": interaction,
        "current_module_messages": state.current_module_messages+2
    }


def explainer_edge(state: TutorState):
    """Routes the graph to appropriate node based on tool class."""
    last_message = state.messages[-1]
    tool_calls = last_message.tool_calls # type: ignore
    if tool_calls:
        tool_names = [tc["name"] for tc in tool_calls]
        if "search_sources" in tool_names:
            return "search_tools"
    return "judge_and_format"


async def judge_and_format(state: TutorState):
    """The judge node to judge AI explainer responses."""
    judge_llm = llm.with_structured_output(AITutorResponse)
    sys_instruction = SystemMessage(
        content=state.judge_system_prompt
    )
    midx = state.current_task.module_index # type: ignore
    module = state.lesson.modules[midx]
    task_prompt = JUDGE_TASK_PROMPT.format(
        task_type=state.current_task.task_type, # type: ignore
        current_module=f"{midx+1}. {module.title}: {module.description}",
        feedback=state.current_task.judge_feedback # type: ignore
    )
    response = AITutorResponse(
        done=True,
        feedback=""
    )
    if state.current_task.task_type != "followup": # type: ignore
        response = await judge_llm.ainvoke(
            [sys_instruction] + state.messages + [HumanMessage(content=task_prompt)]
        )
    return {
        "tutor_response": response
    }


def task_update_and_feedback(state: TutorState) -> dict[str, Any]:
    """
    Gets the judge response and human feedback, updates module statuses,
    and returns the new task along with any updated lesson state.
    """
    response = state.tutor_response
    assert response is not None
    assert state.current_task is not None

    if response.done:
        int_spec = InterruptSpec(
            int_type="complete", int_info="Proceed or ask followup"
        )
        user_int = interrupt(int_spec, response_schema=UserFollowup)
    else:
        int_spec = InterruptSpec(
            int_type="continue", int_info="Proceed further"
        )
        user_int = interrupt(int_spec)

    updates: dict[str] = {}
    current_lesson_status = "in_progress"
    if not response.done:
        new_task = ExplainerTask(
            task_type="continue_module",
            module_index=state.current_task.module_index,
            followup_str="",
            judge_feedback=response.feedback,
        )
    elif user_int.proceed_or_followup:
        cm_idx = state.current_task.module_index
        new_idx = cm_idx + 1

        # Copy the list and individual Pydantic module items to avoid in-place mutation
        updated_modules = list(state.lesson.modules)
        updated_modules[cm_idx] = updated_modules[cm_idx].model_copy(
            update={"status": "completed"}
        )

        if new_idx == len(updated_modules):
            new_task = None
            current_lesson_status = "completed"
        else:
            updated_modules[new_idx] = updated_modules[new_idx].model_copy(
                update={"status": "in_progress"}
            )
            new_task = ExplainerTask(
                task_type="new_module",
                module_index=new_idx,
                followup_str="",
                judge_feedback="",
            )

        # Create an updated copy of the parent lesson model and add it to updates
        updates["lesson"] = state.lesson.model_copy(
            update={
                "modules": updated_modules,
                "status": current_lesson_status
            }
        )
    else:
        new_task = ExplainerTask(
            task_type="followup",
            module_index=state.current_task.module_index,
            followup_str=user_int.followup,
            judge_feedback="",
        )

    updates["current_task"] = new_task
    return updates


async def update_and_continue(state: TutorState):
    """
    Updates lesson and module statuses directly from the current state.lesson object
    to the database via the repository layer.
    """
    await update_lesson_progress(state.lesson)
    return {
        "lesson": state.lesson
    }


async def record_note(state: TutorState):
    """
    Records note of the last current_module_messages from state.messages
    by invoking the note_taker subagent.
    """
    num_messages = state.current_module_messages
    recent_messages = state.messages[-num_messages:] if num_messages > 0 else state.messages
    if recent_messages:
        lesson_id = getattr(state.lesson, "id", None) or state.lesson.thread_id or state.lesson.name
        await note_taker.ainvoke({
            "lesson_id": str(lesson_id),
            "related_messages": recent_messages
        })
    return {
        "current_module_messages": 0
    }


def continue_or_start_assessment(state: TutorState):
    """Decides to continue the graph loop or start assessment."""
    if state.current_task is None:
        return "assessment"
    return "explainer"


async def assessment(state: TutorState):
    """
    Invokes the assessor subagent to generate and save the assessment.
    """
    lesson_id = getattr(state.lesson, "id", None) or state.lesson.thread_id or state.lesson.name
    assessor_input = {
        "lesson_id": str(lesson_id),
        "conversation_history": state.messages,
        "assignment": None
    }
    result = await assessor.ainvoke(assessor_input)
    return {
        "assignment": result.get("assignment")
    }


def build_tutor_graph(checkpointer=None):
    """Builds the final graph of tutor agent."""
    graph = StateGraph(state_schema=TutorState)
    # Adding nodes
    graph.add_node("gathering_start", gathering_start)
    graph.add_node(
        "user_review_and_ingest",
        user_review_and_ingest, # type: ignore
        input_schema=ResourceReviewNodeState
    )
    graph.add_node("explainer", explainer)
    graph.add_node("search_tools", ToolNode([search_sources]))
    graph.add_node("judge_and_format", judge_and_format)
    graph.add_node("task_update_and_feedback", task_update_and_feedback)
    graph.add_node("update_and_continue", update_and_continue)
    graph.add_node("record_note", record_note)
    graph.add_node("assessment", assessment)

    # Adding edges
    graph.add_edge(START, "gathering_start")
    graph.add_edge("gathering_start", "user_review_and_ingest")
    graph.add_edge("user_review_and_ingest", "explainer")
    graph.add_conditional_edges(
        "explainer",
        explainer_edge,
        path_map=["search_tools", "judge_and_format"]
    )
    graph.add_edge("search_tools", "explainer")
    graph.add_edge("judge_and_format", "task_update_and_feedback")
    graph.add_edge("task_update_and_feedback", "update_and_continue")
    graph.add_edge("update_and_continue", "record_note")
    graph.add_conditional_edges(
        "record_note",
        continue_or_start_assessment,
        path_map={
            "explainer": "explainer",
            "assessment": "assessment"
        }
    )
    graph.add_edge("assessment", END)

    compiled_graph = graph.compile(
        checkpointer=checkpointer
    )
    return compiled_graph


dummy_tutor = build_tutor_graph()
