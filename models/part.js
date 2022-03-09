const mongoose = require("mongoose");

const partSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: String },
    views: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    part: { type: Number, default: 0 },
  },
  { versionKey: false }
);

partSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

partSchema.set("toJSON", {
  virtuals: true,
});

exports.Part = mongoose.model("Part", partSchema);
