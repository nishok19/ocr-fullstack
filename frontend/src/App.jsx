import { useEffect } from "react";
import "./App.css";
import PatientAnalyteComparison from "./components/PatientAnalyteComparison";
import { useGlobalContext } from "./GlobalContext";
import FileUpload from "./components/FileUpload";

export const BASE_SERVER_URL = "http://localhost:3000";

function App() {
  const { setPatients } = useGlobalContext();

  useEffect(() => {
    async function fetchAllPatientsData() {
      const results = await fetch(`${BASE_SERVER_URL}/api/patients/`);
      const patientsResults = await results.json();
      if (patientsResults) {
        setPatients(patientsResults);
      }
    }
    fetchAllPatientsData();
  }, []);

  return (
    <section>
      <FileUpload />
      <PatientAnalyteComparison />
    </section>
  );
}

export default App;
