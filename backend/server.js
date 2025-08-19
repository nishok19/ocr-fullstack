require("dotenv").config();
const express = require("express");
const cors = require("cors");
const reportsRoutes = require("./routes/reportRoutes");
const { initalizeDb } = require("./helper/db");
const patientsRoutes = require("./routes/patientsRoutes");

const app = express();
const PORT = process.env.PORT;

initalizeDb();

app.use(express.json()); // parse JSON bodies
app.use(cors());

// Routes
app.use("/api/report", reportsRoutes);
app.use("/api/patients", patientsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
