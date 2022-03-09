const mongoose = require("mongoose");

const storySchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    image: String,
    description: { type: String },
    mainCharecters: { type: String },
    category: {
      type: String,
    },
    language: { type: String },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    tags: [{ type: String }],
    parts: [{ type: Object }],
  },
  { versionKey: false }
);

storySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

storySchema.set("toJSON", {
  virtuals: true,
});

exports.Story = mongoose.model("Story", storySchema);
