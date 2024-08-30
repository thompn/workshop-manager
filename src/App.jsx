// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeServiceRecordsCollection } from './firebaseOperations';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Login from './pages/Login';
import Register from './pages/Register';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  useEffect(() => {
    initializeServiceRecordsCollection();
  }, []);

  return (
    <AuthProvider>
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
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
                <Route path="/projects/:id" element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
                <Route path="/projects/manage" element={<PrivateRoute><ManageProjects /></PrivateRoute>} />
                <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
                <Route path="/vehicles/:id" element={<PrivateRoute><VehicleDetailsWithService /></PrivateRoute>} />
                <Route path="/vehicles/:id/add-service" element={<PrivateRoute><AddServiceRecord /></PrivateRoute>} />
                <Route path="/vehicles/manage" element={<PrivateRoute><ManageVehicles /></PrivateRoute>} />
                <Route path="/parts" element={<PrivateRoute><Parts /></PrivateRoute>} />
                <Route path="/parts/manage" element={<PrivateRoute><ManageParts /></PrivateRoute>} />
                <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
                <Route path="/tools/manage" element={<PrivateRoute><ManageTools /></PrivateRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;