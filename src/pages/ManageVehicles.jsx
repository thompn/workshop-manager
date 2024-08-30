import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { FaEdit, FaTrash } from 'react-icons/fa';

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
      const vehicleList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(vehicleList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleInputChange = (e, vehicleState, setVehicleState) => {
    const { name, value, type, checked } = e.target;
    setVehicleState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Math.max(0, parseFloat(value) || 0) : value
    }));
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

  const renderVehicleForm = (vehicle, setVehicle, submitHandler, buttonText) => (
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
        field.name === "cost" ? (
          <div key={field.name} className="flex flex-col">
            <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={vehicle[field.name]}
              onChange={(e) => handleInputChange(e, vehicle, setVehicle)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatCost(vehicle[field.name])}
            </span>
          </div>
        ) : (
          <div key={field.name} className="flex flex-col">
            <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={vehicle[field.name]}
              onChange={(e) => handleInputChange(e, vehicle, setVehicle)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )
      ))}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="insured"
          name="insured"
          checked={vehicle.insured}
          onChange={(e) => handleInputChange(e, vehicle, setVehicle)}
          className="mr-2"
        />
        <label htmlFor="insured" className="text-gray-800 dark:text-white">Insured</label>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="gps_tracking_enabled"
          name="gps_tracking_enabled"
          checked={vehicle.gps_tracking_enabled}
          onChange={(e) => handleInputChange(e, vehicle, setVehicle)}
          className="mr-2"
        />
        <label htmlFor="gps_tracking_enabled" className="text-gray-800 dark:text-white">GPS Tracking Enabled</label>
      </div>
    </div>
  );

  return (
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
          {renderVehicleForm(newVehicle, setNewVehicle, handleAddVehicle, "Add Vehicle")}
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
                  <tr>
                    <td colSpan="6" className="p-4 bg-gray-100 dark:bg-gray-900">
                      {editingVehicle === vehicle.id ? (
                        <>
                          {renderVehicleForm(vehicle, (updatedVehicle) => {
                            const updatedVehicles = vehicles.map(v => v.id === vehicle.id ? updatedVehicle : v);
                            setVehicles(updatedVehicles);
                          }, handleSaveEdit, "Save Changes")}
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
                            key !== 'id' && (
                              <div key={key} className="text-gray-800 dark:text-white">
                                <strong>{formatFieldName(key)}:</strong>
                                <span className="ml-2">{value.toString()}</span>
                              </div>
                            )
                          ))}
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
  );
};

export default ManageVehicles;