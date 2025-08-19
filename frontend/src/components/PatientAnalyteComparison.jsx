import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp, User, TestTube } from "lucide-react";
import { useGlobalContext } from "../GlobalContext";

// Sample data based on your lab report structure

const colors = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function PatientAnalyteComparison() {
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [selectedAnalytes, setSelectedAnalytes] = useState([]);

  const { patients: fetchedPatients } = useGlobalContext();

  // Get unique patients
  const patients = useMemo(() => {
    const patientMap = new Map();
    fetchedPatients.forEach((report) => {
      if (!patientMap.has(report.name)) {
        patientMap.set(report.name, {
          name: report.name,
          reportCount: 0,
        });
      }
      patientMap.get(report.name).reportCount++;
    });
    return Array.from(patientMap.values());
  }, [selectedPatientName, fetchedPatients]);

  // Get reports for selected patient
  const patientReports = useMemo(() => {
    return fetchedPatients
      .filter((report) => report.name === selectedPatientName)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedPatientName]);

  // Get unique analytes for the selected patient
  const availableAnalytes = useMemo(() => {
    if (!selectedPatientName) return [];

    const analytesSet = new Set();
    patientReports.forEach((report) => {
      Object.values(report.data.tests).forEach((testGroup) => {
        testGroup.forEach((test) => {
          if (test.parameter && typeof test.result === "number") {
            analytesSet.add(test.parameter);
          }
        });
      });
    });

    return Array.from(analytesSet).sort();
  }, [patientReports]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedPatientName || selectedAnalytes.length === 0) return [];

    return patientReports.map((report) => {
      const dataPoint = {
        date: new Date(report.date).toISOString().split("T")[0],
        reportId: report._id,
      };

      // Extract values for selected analytes
      selectedAnalytes.forEach((analyteName) => {
        let value = null;
        Object.values(report.data.tests).forEach((testGroup) => {
          testGroup.forEach((test) => {
            if (
              test.parameter === analyteName &&
              typeof test.result === "number"
            ) {
              value = test.result;
            }
          });
        });
        dataPoint[analyteName] = value;
      });

      return dataPoint;
    });
  }, [patientReports, selectedAnalytes]);

  const handlePatientChange = (e) => {
    setSelectedPatientName(e.target.value);
    setSelectedAnalytes([]); // Reset selected analytes when patient changes
  };

  const handleAnalyteToggle = (analyte) => {
    setSelectedAnalytes((prev) => {
      if (prev.includes(analyte)) {
        return prev.filter((a) => a !== analyte);
      } else {
        return [...prev, analyte];
      }
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Custom tooltip to show units and reference ranges
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const reportDate = formatDate(label);

      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Date: ${reportDate}`}</p>
          {payload.map((entry, index) => {
            // Find the unit and reference for this parameter
            let unit = "";
            let reference = "";

            const report = patientReports.find(
              (r) => r.date.split("T")[0] === label
            );
            if (report) {
              Object.values(report.data.tests).forEach((testGroup) => {
                testGroup.forEach((test) => {
                  if (test.parameter === entry.dataKey) {
                    unit = test.unit || "";
                    reference = test.reference || "";
                  }
                });
              });
            }

            return (
              <div key={index} className="mb-1">
                <p style={{ color: entry.color }} className="font-medium">
                  {`${entry.dataKey}: ${entry.value}${unit ? " " + unit : ""}`}
                </p>
                {reference && (
                  <p className="text-xs text-gray-500">
                    {`Reference: ${reference}${unit ? " " + unit : ""}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <TrendingUp className="text-blue-600" size={40} />
            Lab Results Comparison System
          </h1>
          <p className="text-lg text-gray-600">
            Analyze patient lab result trends over time
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Select Patient
              </label>
              <select
                value={selectedPatientName}
                onChange={handlePatientChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.name} value={patient.name}>
                    {patient.name} ({patient.reportCount} reports)
                  </option>
                ))}
              </select>
            </div>

            {/* Analyte Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TestTube size={18} className="text-green-600" />
                Select Parameters to Compare
              </label>
              {availableAnalytes.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableAnalytes.map((analyte) => (
                    <label
                      key={analyte}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAnalytes.includes(analyte)}
                        onChange={() => handleAnalyteToggle(analyte)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{analyte}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm italic p-3 border border-gray-200 rounded-lg">
                  Please select a patient to view available parameters
                </div>
              )}
            </div>
          </div>

          {/* Selected items summary */}
          {selectedPatientName && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar size={18} />
                <span className="font-medium">
                  Patient: {selectedPatientName} | Reports:{" "}
                  {patientReports.length} | Selected Parameters:{" "}
                  {selectedAnalytes.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && selectedAnalytes.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Parameter Trends Over Time
            </h2>
            <div style={{ width: "100%", height: "500px" }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedAnalytes.map((analyte, index) => (
                    <Line
                      key={analyte}
                      type="monotone"
                      dataKey={analyte}
                      stroke={colors[index % colors.length]}
                      strokeWidth={3}
                      dot={{
                        fill: colors[index % colors.length],
                        strokeWidth: 2,
                        r: 5,
                      }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : selectedPatientName && selectedAnalytes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <TestTube size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Parameters Selected
            </h3>
            <p className="text-gray-500">
              Please select one or more lab parameters to view the comparison
              chart
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Lab Results Analysis
            </h3>
            <p className="text-gray-500">
              Select a patient from the dropdown above to begin analyzing their
              lab results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientAnalyteComparison;
