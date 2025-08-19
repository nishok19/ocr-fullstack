const express = require("express");
const MultiFormatOCRExtractor = require("../helper/OcrExtracter");
const multer = require("multer");
const parseLabReport = require("../helper/textToJson");
const ReportSchema = require("../schema/ReportSchema");
const router = express.Router();

const ocrExtractor = new MultiFormatOCRExtractor();

upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Please upload PDF, PNG, or JPG files."
        ),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const createReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`Processing ${req.file.originalname} (${req.file.mimetype})`);

    const result = await ocrExtractor.extractText(req.file, {
      ocrLanguage: req.body.language || "eng",
      fallbackToOCR: true,
      imageQuality: parseInt(req.body.quality) || 300,
    });

    const convertedText = await parseLabReport(result.text);

    const resultToSave = {
      filename: req.file.originalname,
      fileType: result.fileType,
      method: result.method,
      name: convertedText.patient.name?.trim(),
      date: new Date(),
      data: convertedText,
      pages: result.pages,
      confidence: result.confidence,
      wordCount: result.text.split(/\s+/).length,
      characterCount: result.text.length,
    };

    const newDbReport = await new ReportSchema(resultToSave);
    await newDbReport.save();
    if (newDbReport) {
      res.status(201).json({
        success: true,
        ...newDbReport,
      });
    } else {
      throw new Error("Error while creating a report entry in db");
    }
  } catch (error) {
    console.error("Extraction failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

router.get("/", (req, res) => res.send("hii"));
// router.get("/:patient_name", getReportsByPatient);
router.post("/", upload.single("sample_report"), createReport);

module.exports = router;
