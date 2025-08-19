const express = require("express");
const ReportSchema = require("../schema/ReportSchema");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const results = await ReportSchema.find();

    if (results) {
      res.json(results);
    }
  } catch (err) {
    console.error("Cannot get all patients:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;

    const patientDetails = await ReportSchema.findOne({ name: name });

    if (patientDetails) {
      res.json({ patient: patientDetails });
    } else {
      res.status(404).json({
        patient: null,
      });
    }
  } catch (err) {
    console.error("Cannot get the patient details:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
