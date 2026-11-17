import mongoose from "mongoose";

// Score and feedback the grader gave one descriptive answer.
const DescriptiveEvaluationSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true
    },

    feedback: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

// A user's graded submission for an assignment (written by the agent).
const AssignmentAnswersSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: String,
      required: true,
      index: true,
      alias: "assignmentId"
    },

    mcq_answers: {
      type: [String],
      enum: ["a", "b", "c", "d"],
      default: [],
      alias: "mcqAnswers"
    },

    descriptive_answers: {
      type: [String],
      default: [],
      alias: "descriptiveAnswers"
    },

    descriptive_evaluations: {
      type: [DescriptiveEvaluationSchema],
      default: [],
      alias: "descriptiveEvaluations"
    },

    score: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const AssignmentAnswers =
  mongoose.models.AssignmentAnswers ||
  mongoose.model("AssignmentAnswers", AssignmentAnswersSchema, "assignment_answers");

export default AssignmentAnswers;
