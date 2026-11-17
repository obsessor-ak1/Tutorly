import mongoose from "mongoose";

const NoteElementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    element_type: {
      type: String,
      required: true,
      enum: [
        "concept",
        "definition",
        "principle",
        "procedure",
        "equation",
        "example",
        "comparison",
        "application",
        "caveat"
      ],
      alias: "elementType"
    },

    related_concepts: {
      type: [String],
      default: [],
      alias: "relatedConcepts"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const NoteSchema = new mongoose.Schema(
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
      required: false
    },

    elements: {
      type: [NoteElementSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for note id
NoteSchema.virtual("note_id").get(function () {
  return this._id ? this._id.toString() : undefined;
});

NoteSchema.virtual("noteId").get(function () {
  return this._id ? this._id.toString() : undefined;
});

export const Note =
  mongoose.models.Note ||
  mongoose.model("Note", NoteSchema);

export default Note;
