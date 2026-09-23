import mongoose from "mongoose";

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started"
  }
});


const LessonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  modules: {
    type: [ModuleSchema],
    default: []
  },

  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started"
  }
});


const TopicSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    description: String,

    lessons: {
      type: [LessonSchema],
      default: []
    },

    teachingStyle: String,

    persona: String,

    topicFamiliarityLevel: String,

    additionalUserRemarks: String
  },

  {
    timestamps: true
  }
);


export const Topic =
  mongoose.models.Topic ||
  mongoose.model("Topic", TopicSchema);