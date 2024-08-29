import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from '../firebase';

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

  const handleInputChange = (e) => {
    setNewVehicle({ ...newVehicle, [e.target.name]: e.target.value });
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
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="license_plate"
              placeholder="License Plate"
              value={newVehicle.license_plate}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="vin"
              placeholder="VIN"
              value={newVehicle.vin}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="make"
              placeholder="Make"
              value={newVehicle.make}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="model"
              placeholder="Model"
              value={newVehicle.model}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              name="year"
              placeholder="Year"
              value={newVehicle.year}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              name="current_mileage"
              placeholder="Current Mileage"
              value={newVehicle.current_mileage}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="color"
              placeholder="Color"
              value={newVehicle.color}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="vehicle_type"
              placeholder="Vehicle Type"
              value={newVehicle.vehicle_type}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="date"
              name="purchase_date"
              placeholder="Purchase Date"
              value={newVehicle.purchase_date}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="status"
              placeholder="Status"
              value={newVehicle.status}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="engine_type"
              placeholder="Engine Type"
              value={newVehicle.engine_type}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="fuel_type"
              placeholder="Fuel Type"
              value={newVehicle.fuel_type}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="transmission_type"
              placeholder="Transmission Type"
              value={newVehicle.transmission_type}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              name="seating_capacity"
              placeholder="Seating Capacity"
              value={newVehicle.seating_capacity}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <input
              type="number"
              name="cargo_volume"
              placeholder="Cargo Volume"
              value={newVehicle.cargo_volume}
              onChange={handleInputChange}
              className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                name="insured"
                checked={newVehicle.insured}
                onChange={(e) => {
                  setNewVehicle({
                    ...newVehicle,
                    insured: e.target.checked,
                    showInsuranceFields: e.target.checked
                  });
                }}
                className="mr-2"
              />
              <label className="text-gray-800 dark:text-white">Insured</label>
            </div>
            {newVehicle.insured && (
              <>
                <input
                  type="text"
                  name="insurance_provider"
                  placeholder="Insurance Provider"
                  value={newVehicle.insurance_provider}
                  onChange={handleInputChange}
                  className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  name="insurance_policy_number"
                  placeholder="Insurance Policy Number"
                  value={newVehicle.insurance_policy_number}
                  onChange={handleInputChange}
                  className="p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                />
              </>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="gps_tracking_enabled"
                checked={newVehicle.gps_tracking_enabled}
                onChange={(e) => setNewVehicle({...newVehicle, gps_tracking_enabled: e.target.checked})}
                className="mr-2"
              />
              <label className="text-gray-800 dark:text-white">GPS Tracking Enabled</label>
            </div>
          </div>
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
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle.id);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedVehicle === vehicle.id && (
                  <tr>
                    <td colSpan="6" className="p-4 bg-gray-100 dark:bg-gray-900">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(vehicle).map(([key, value]) => (
                          key !== 'id' && (
                            <div key={key} className="text-gray-800 dark:text-white">
                              <strong>{formatFieldName(key)}:</strong>
                              {editingVehicle === vehicle.id ? (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleEditInputChange(e, vehicle.id, key)}
                                  className="ml-2 p-1 bg-white dark:bg-gray-700 rounded text-gray-800 dark:text-white"
                                />
                              ) : (
                                <span className="ml-2">{value.toString()}</span>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                      {editingVehicle === vehicle.id && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleSaveEdit(vehicle.id)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
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