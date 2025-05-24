import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PartsProvider } from './context/PartsContext'; // Import the PartsProvider
import { NotificationProvider, useNotification } from './contexts/NotificationContext'; // Added
import NotificationBar from './components/NotificationBar'; // Added
import Header from './components/Header';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import Tools from './pages/Tools';
import { FaWrench } from 'react-icons/fa';
import VehicleDetails from './pages/VehicleDetails';
import ManageTools from './pages/ManageTools';
import ManageParts from './pages/ManageParts';
import ManageVehicles from './pages/ManageVehicles';
import VehicleDetailsWithService from './pages/VehicleDetailsWithService';
import AddServiceRecord from './pages/AddServiceRecord';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './components/UserProfile';
import ManageLocations from './pages/ManageLocations';
import LocationDetails from './pages/LocationDetails';
import ManageVehicleChecklists from './pages/ManageVehicleChecklists';
import EpicDetails from './pages/EpicDetails';
import AdminUpload from './components/AdminUpload';
import ManageSuppliers from './pages/ManageSuppliers';
import ToDoPage from './pages/ToDoPage'; // Import the new ToDoPage
import StockTakePage from './pages/StockTakePage'; // <-- Add this import

// Define PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return currentUser ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { theme } = useTheme();
  const { currentUser, loading } = useAuth();
  const { notification, hideNotification } = useNotification(); // Added

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <NotificationBar 
          message={notification.message} 
          type={notification.type} 
          onClose={hideNotification} 
        /> {/* Added */}
        <Header />
        <main className="container mx-auto px-4 py-8 grid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/todo" element={<PrivateRoute><ToDoPage /></PrivateRoute>} />
            <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
            <Route path="/vehicles/:id" element={<PrivateRoute><VehicleDetailsWithService /></PrivateRoute>} />
            <Route path="/vehicles/:id/add-service" element={<PrivateRoute><AddServiceRecord /></PrivateRoute>} />
            <Route path="/vehicles/manage" element={<PrivateRoute><ManageVehicles /></PrivateRoute>} />
            <Route path="/parts" element={<PrivateRoute><ManageParts /></PrivateRoute>} />
            <Route path="/parts/manage" element={<PrivateRoute><ManageParts /></PrivateRoute>} />
            <Route path="/stock-take" element={<PrivateRoute><StockTakePage /></PrivateRoute>} />
            <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
            <Route path="/tools/manage" element={<PrivateRoute><ManageTools /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/locations/manage" element={<PrivateRoute><ManageLocations /></PrivateRoute>} />
            <Route path="/locations/:id" element={<PrivateRoute><LocationDetails /></PrivateRoute>} />
            <Route path="/manage-checklists" element={<ManageVehicleChecklists />} />
            <Route path="/admin/upload" element={<PrivateRoute><AdminUpload /></PrivateRoute>} />
            <Route path="/suppliers/manage" element={<PrivateRoute><ManageSuppliers /></PrivateRoute>} />
            <Route path="/suppliers" element={<ManageSuppliers />} />
            <Route path="/locations" element={<ManageLocations />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider> {/* Added */}
          <PartsProvider> {/* Wrap the application with PartsProvider */}
            <Router>
              <AppContent />
            </Router>
          </PartsProvider>
        </NotificationProvider> {/* Added */}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;