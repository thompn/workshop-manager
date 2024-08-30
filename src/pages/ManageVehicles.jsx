import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import { getServiceRecordsByVehicle } from '../firebaseOperations';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }

    return this.props.children;
  }
}

const ManageVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type_id: '',
    license_plate: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    current_mileage: '',
    color: '',
    vehicle_type: '',
    purchase_date: '',
    status: '',
    engine_type: '',
    fuel_type: '',
    transmission_type: '',
    seating_capacity: '',
    cargo_volume: '',
    insured: false,
    insurance_provider: '',
    insurance_policy_number: '',
    gps_tracking_enabled: false,
    vehicle_type_details: {
      type_id: '',
      vehicle_type: ''
    },
    latest_service: {
      service_id: '',
      service_date: '',
      service_type: '',
      service_mileage: '',
      cost: '',
      brake_pads_checked: false,
      oil_checked: false,
      air_filter_checked: false,
      chain_checked: false,
      fuel_lines_checked: false,
      bearings_checked: false,
      tires_checked: false,
      lights_checked: false,
      battery_checked: false,
      coolant_level_checked: false,
      transmission_fluid_checked: false,
      exhaust_system_checked: false
    },
    current_location: {
      location_id: '',
      location_reference: '',
      description: ''
    },
    latest_service: {
      service_date: '',
      service_type: '',
      service_mileage: '',
    }
  });
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  const handleEditClick = (e, vehicle) => {
    e.stopPropagation();
    setEditingVehicle(prevState => prevState === vehicle.id ? null : vehicle.id);
    setExpandedVehicle(vehicle.id);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehicleList = await Promise.all(querySnapshot.docs.map(async doc => {
        const vehicleData = { id: doc.id, ...doc.data() };
        try {
          const serviceRecords = await getServiceRecordsByVehicle(doc.id);
          const latestService = serviceRecords.length > 0 
            ? serviceRecords.reduce((latest, current) => 
                new Date(current.service_date) > new Date(latest.service_date) ? current : latest
              ) 
            : null;
          return { ...vehicleData, latest_service: latestService };
        } catch (error) {
          console.error(`Error fetching service records for vehicle ${doc.id}:`, error);
          return vehicleData; // Return vehicle data without service records if there's an error
        }
      }));
      setVehicles(vehicleList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleInputChange = (e, vehicleId = null) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (vehicleId) {
      // Editing an existing vehicle
      setVehicles(prevVehicles => prevVehicles.map(vehicle => 
        vehicle.id === vehicleId 
          ? name.startsWith('latest_service.')
            ? { ...vehicle, latest_service: { ...vehicle.latest_service, [name.split('.')[1]]: newValue } }
            : { ...vehicle, [name]: newValue }
          : vehicle
      ));
    } else {
      // Adding a new vehicle
      setNewVehicle(prev => 
        name.startsWith('latest_service.')
          ? { ...prev, latest_service: { ...prev.latest_service, [name.split('.')[1]]: newValue } }
          : { ...prev, [name]: newValue }
      );
    }
  };

  const handleAddVehicle = async () => {
    try {
      await addDoc(collection(db, "vehicles"), newVehicle);
      setNewVehicle({
        vehicle_type_id: '',
        license_plate: '',
        vin: '',
        make: '',
        model: '',
        year: '',
        current_mileage: '',
        color: '',
        vehicle_type: '',
        purchase_date: '',
        status: '',
        engine_type: '',
        fuel_type: '',
        transmission_type: '',
        seating_capacity: '',
        cargo_volume: '',
        insured: false,
        insurance_provider: '',
        insurance_policy_number: '',
        gps_tracking_enabled: false,
        vehicle_type_details: {
          type_id: '',
          vehicle_type: ''
        },
        latest_service: {
          service_id: '',
          service_date: '',
          service_type: '',
          service_mileage: '',
          cost: '',
          brake_pads_checked: false,
          oil_checked: false,
          air_filter_checked: false,
          chain_checked: false,
          fuel_lines_checked: false,
          bearings_checked: false,
          tires_checked: false,
          lights_checked: false,
          battery_checked: false,
          coolant_level_checked: false,
          transmission_fluid_checked: false,
          exhaust_system_checked: false
        },
        current_location: {
          location_id: '',
          location_reference: '',
          description: ''
        },
        latest_service: {
          service_date: '',
          service_type: '',
          service_mileage: '',
        }
      });
      fetchVehicles();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  };

  const handleEditVehicle = async (id, updatedVehicle) => {
    try {
      await updateDoc(doc(db, "vehicles", id), updatedVehicle);
      fetchVehicles();
      setEditingVehicle(null);
    } catch (error) {
      console.error("Error updating vehicle:", error);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await deleteDoc(doc(db, "vehicles", id));
      fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const toggleExpandVehicle = (vehicleId) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
    } else {
      setExpandedVehicle(vehicleId);
    }
  };

  const handleEditInputChange = (e, vehicleId, key) => {
    const updatedVehicles = vehicles.map(vehicle => {
      if (vehicle.id === vehicleId) {
        return { ...vehicle, [key]: e.target.value };
      }
      return vehicle;
    });
    setVehicles(updatedVehicles);
  };

  const handleSaveEdit = async (vehicleId) => {
    const updatedVehicle = vehicles.find(vehicle => vehicle.id === vehicleId);
    try {
      await updateDoc(doc(db, "vehicles", vehicleId), updatedVehicle);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error("Error updating vehicle:", error);
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCost = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const renderVehicleForm = (vehicle, isEditing = false) => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { name: "license_plate", label: "License Plate", type: "text" },
        { name: "vin", label: "VIN", type: "text" },
        { name: "make", label: "Make", type: "text" },
        { name: "model", label: "Model", type: "text" },
        { name: "year", label: "Year", type: "number" },
        { name: "current_mileage", label: "Current Mileage", type: "number" },
        { name: "color", label: "Color", type: "text" },
        { name: "vehicle_type", label: "Vehicle Type", type: "text" },
        { name: "purchase_date", label: "Purchase Date", type: "date" },
        { name: "status", label: "Status", type: "text" },
        { name: "engine_type", label: "Engine Type", type: "text" },
        { name: "fuel_type", label: "Fuel Type", type: "text" },
        { name: "transmission_type", label: "Transmission Type", type: "text" },
        { name: "seating_capacity", label: "Seating Capacity", type: "number" },
        { name: "cargo_volume", label: "Cargo Volume", type: "number" },
        { name: "insurance_provider", label: "Insurance Provider", type: "text" },
        { name: "insurance_policy_number", label: "Insurance Policy Number", type: "text" },
      ].map((field) => (
        <div key={field.name} className="flex flex-col">
          <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
          </label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={isEditing ? vehicle[field.name] : newVehicle[field.name]}
            onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      ))}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="insured"
          name="insured"
          checked={isEditing ? vehicle.insured : newVehicle.insured}
          onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
          className="mr-2"
        />
        <label htmlFor="insured" className="text-gray-800 dark:text-white">Insured</label>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="gps_tracking_enabled"
          name="gps_tracking_enabled"
          checked={isEditing ? vehicle.gps_tracking_enabled : newVehicle.gps_tracking_enabled}
          onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
          className="mr-2"
        />
        <label htmlFor="gps_tracking_enabled" className="text-gray-800 dark:text-white">GPS Tracking Enabled</label>
      </div>
      <div className="col-span-2">
        <h3 className="text-lg font-semibold mb-2">Latest Service</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="latest_service.service_date" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Date
            </label>
            <input
              type="date"
              id="latest_service.service_date"
              name="latest_service.service_date"
              value={isEditing ? vehicle.latest_service.service_date : newVehicle.latest_service.service_date}
              onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="latest_service.service_type" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Type
            </label>
            <input
              type="text"
              id="latest_service.service_type"
              name="latest_service.service_type"
              value={isEditing ? vehicle.latest_service.service_type : newVehicle.latest_service.service_type}
              onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="latest_service.service_mileage" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Mileage
            </label>
            <input
              type="number"
              id="latest_service.service_mileage"
              name="latest_service.service_mileage"
              value={isEditing ? vehicle.latest_service.service_mileage : newVehicle.latest_service.service_mileage}
              onChange={(e) => handleInputChange(e, isEditing ? vehicle.id : null)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Vehicles</h1>
          <div>
            <button
              onClick={toggleAddForm}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
            >
              {showAddForm ? 'Hide Add Form' : 'Add Vehicle'}
            </button>
            <Link to="/vehicles" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
              Back to Vehicles
            </Link>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Vehicle</h2>
            {renderVehicleForm(newVehicle, false)}
            <button
              onClick={handleAddVehicle}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Vehicle
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold p-4 text-gray-800 dark:text-white">Existing Vehicles</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="p-2 text-left text-gray-800 dark:text-white">License Plate</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Make</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Model</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Year</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Status</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Last Service</th>
                <th className="p-2 text-left text-gray-800 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => (
                <React.Fragment key={vehicle.id}>
                  <tr 
                    className="border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleExpandVehicle(vehicle.id)}
                  >
                    <td className="p-2 text-gray-800 dark:text-white">{vehicle.license_plate}</td>
                    <td className="p-2 text-gray-800 dark:text-white">{vehicle.make}</td>
                    <td className="p-2 text-gray-800 dark:text-white">{vehicle.model}</td>
                    <td className="p-2 text-gray-800 dark:text-white">{vehicle.year}</td>
                    <td className="p-2 text-gray-800 dark:text-white">{vehicle.status}</td>
                    <td className="p-2 text-gray-800 dark:text-white">
                      {vehicle.latest_service 
                        ? new Date(vehicle.latest_service.service_date).toLocaleDateString() 
                        : 'No service record'}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={(e) => handleEditClick(e, vehicle)}
                        className="text-yellow-500 hover:text-yellow-700 mr-2"
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVehicle(vehicle.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="text-xl" />
                      </button>
                    </td>
                  </tr>
                  {expandedVehicle === vehicle.id && (
                    <tr key={`expanded-${vehicle.id}`}>
                      <td colSpan="7" className="p-4 bg-gray-100 dark:bg-gray-900">
                        {editingVehicle === vehicle.id ? (
                          <>
                            {renderVehicleForm(vehicle, true)}
                            <div className="mt-4 flex justify-end space-x-2">
                              <button
                                onClick={() => handleSaveEdit(vehicle.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingVehicle(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(vehicle).map(([key, value]) => (
                              key !== 'id' && key !== 'latest_service' && (
                                <div key={key} className="text-gray-800 dark:text-white">
                                  <strong>{formatFieldName(key)}:</strong>
                                  <span className="ml-2">{value.toString()}</span>
                                </div>
                              )
                            ))}
                            <div className="col-span-2">
                              <strong>Latest Service:</strong>
                              <div className="ml-4">
                                <p>Date: {vehicle.latest_service && vehicle.latest_service.service_date ? format(new Date(vehicle.latest_service.service_date), 'dd/MM/yyyy') : 'N/A'}</p>
                                <p>Type: {vehicle.latest_service && vehicle.latest_service.service_type || 'N/A'}</p>
                                <p>Mileage: {vehicle.latest_service && vehicle.latest_service.service_mileage || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ManageVehicles;