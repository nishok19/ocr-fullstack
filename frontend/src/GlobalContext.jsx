import React, { createContext, useContext, useState } from "react";

// Create the context
const GlobalContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);

  return (
    <GlobalContext.Provider
      value={{
        patients,
        setPatients,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook for easy usage
export const useGlobalContext = () => useContext(GlobalContext);
