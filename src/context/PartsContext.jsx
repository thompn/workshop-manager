import React, { createContext, useState, useContext } from 'react';

const PartsContext = createContext();

export const PartsProvider = ({ children }) => {
  const [updateParts, setUpdateParts] = useState(false);

  return (
    <PartsContext.Provider value={{ updateParts, setUpdateParts }}>
      {children}
    </PartsContext.Provider>
  );
};

export const useParts = () => useContext(PartsContext);