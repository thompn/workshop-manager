// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeServiceRecordsCollection } from './firebaseOperations';
import Header from './components/Header';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Vehicles from './pages/Vehicles';
import Parts from './pages/Parts';
import Tools from './pages/Tools';
import { ThemeProvider } from './context/ThemeContext';
import { FaWrench } from 'react-icons/fa';
import ProjectDetails from './pages/ProjectDetails';
import VehicleDetails from './pages/VehicleDetails';
import ManageTools from './pages/ManageTools';
import ManageParts from './pages/ManageParts';
import ManageProjects from './pages/ManageProjects';
import ManageVehicles from './pages/ManageVehicles';
import VehicleDetailsWithService from './pages/VehicleDetailsWithService';
import AddServiceRecord from './pages/AddServiceRecord';

function App() {
  useEffect(() => {
    initializeServiceRecordsCollection();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center mb-8">
              <FaWrench className="text-4xl mr-2 text-blue-500" />
              <h1 className="text-3xl font-bold">Workshop Management</h1>
            </div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              <Route path="/projects/manage" element={<ManageProjects />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/vehicles/:id" element={<VehicleDetailsWithService />} />
              <Route path="/vehicles/:id/add-service" element={<AddServiceRecord />} />
              <Route path="/vehicles/manage" element={<ManageVehicles />} />
              <Route path="/parts" element={<Parts />} />
              <Route path="/parts/manage" element={<ManageParts />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/manage" element={<ManageTools />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;