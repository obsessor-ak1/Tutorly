"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import { Topic } from "@/models/Topic";
import { AGENT_BASE_URL as API_BASE } from "@/lib/agentConfig";

export async function generateTopicAction(payload) {
  try {
    const res = await fetch(`${API_BASE}/agent/topic/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to generate topic via AI agent.");
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function refineTopicAction(payload) {
  try {
    const res = await fetch(`${API_BASE}/agent/topic/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to refine topic.");
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function createTopicAction(generatedTopic) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    await dbConnect();

    // Map the agent's generated topic schema to the Mongoose schema
    const newTopic = new Topic({
      userId: session.user.id,
      name: generatedTopic.name,
      description: generatedTopic.description,
      lessons: generatedTopic.lessons,
      teachingStyle: generatedTopic.teaching_style,
      persona: generatedTopic.persona,
      topicFamiliarityLevel: generatedTopic.topic_familiarity_level || generatedTopic.familiarity_level,
      additionalUserRemarks: generatedTopic.additional_user_remarks || generatedTopic.additional_info
    });

    await newTopic.save();

    // Return the saved document as a plain object
    return { success: true, data: JSON.parse(JSON.stringify(newTopic)) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}