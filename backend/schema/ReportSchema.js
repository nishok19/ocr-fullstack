const mongoose = require("mongoose");

const TestResultSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    result: { type: Number, required: true },
    unit: { type: String },
    reference: { type: String },
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf", "text"], required: true },
    method: { type: String, enum: ["ocr", "manual", "import"], required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    data: {
      lab_info: {
        phone: { type: String, default: null },
        email: { type: String, default: null },
        website: { type: String, default: null },
        name: { type: String, default: null },
      },
      patient: {
        name: { type: String, default: null },
      },
      // Map of dynamic section names to an array of test results
      tests: {
        type: Object,
        of: [TestResultSchema],
      },
      clinical_notes: { type: String, default: null },
      signatories: { type: [String], default: [] },
    },
    pages: { type: Number },
    confidence: { type: Number },
    wordCount: { type: Number },
    characterCount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
