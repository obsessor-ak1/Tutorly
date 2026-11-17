import mongoose from "mongoose";

const OptionsSchema = new mongoose.Schema(
  {
    a: {
      type: String,
      required: true
    },
    b: {
      type: String,
      required: true
    },
    c: {
      type: String,
      required: true
    },
    d: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const MCQSchema = new mongoose.Schema(
  {
    question_text: {
      type: String,
      required: true,
      alias: "questionText"
    },

    options: {
      type: OptionsSchema,
      required: true
    },

    correct_option: {
      type: String,
      enum: ["a", "b", "c", "d"],
      required: true,
      alias: "correctOption"
    },

    explanation: {
      type: String,
      required: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const DescriptiveQuestionSchema = new mongoose.Schema(
  {
    question_text: {
      type: String,
      required: true,
      alias: "questionText"
    },

    correct_answer: {
      type: String,
      required: true,
      alias: "correctAnswer"
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const AssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
      index: true,
      alias: "user_id"
    },

    lesson_id: {
      type: String,
      required: false,
      index: true,
      alias: "lessonId"
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    mcqs: {
      type: [MCQSchema],
      default: []
    },

    descriptives: {
      type: [DescriptiveQuestionSchema],
      default: []
    },

    score: {
      type: Number,
      default: null
    },

    // Reference to the user's submission in 'assignment_answers'.
    // Present only once the assignment has been attempted.
    answers_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignmentAnswers",
      default: null,
      alias: "answersId"
    },

    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals to reflect Pydantic's assignment_id (alias of _id)
AssignmentSchema.virtual("assignment_id")
  .get(function () {
    return this._id ? this._id.toString() : undefined;
  })
  .set(function (val) {
    if (val) {
      this._id = val;
    }
  });

// An assignment is attempted once answers have been submitted for it.
AssignmentSchema.virtual("attempted").get(function () {
  return Boolean(this.answers_id);
});

AssignmentSchema.virtual("assignmentId").get(function () {
  return this._id ? this._id.toString() : undefined;
});

export const Assignment =
  mongoose.models.Assignment ||
  mongoose.model("Assignment", AssignmentSchema);

export default Assignment;
