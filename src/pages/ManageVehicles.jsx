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
    gps_tracking_enabled: false
  });

  const [editingVehicle, setEditingVehicle] = useState(null);

  const handleEditClick = (vehicle) => {
    setEditingVehicle({ ...vehicle });
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
        gps_tracking_enabled: false
      });
      fetchVehicles();
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Vehicles</h1>
        <Link to="/vehicles" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Vehicles
        </Link>
      </div>

      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-white">Add New Vehicle</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="license_plate"
            placeholder="License Plate"
            value={newVehicle.license_plate}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="vin"
            placeholder="VIN"
            value={newVehicle.vin}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="make"
            placeholder="Make"
            value={newVehicle.make}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="model"
            placeholder="Model"
            value={newVehicle.model}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="year"
            placeholder="Year"
            value={newVehicle.year}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="current_mileage"
            placeholder="Current Mileage"
            value={newVehicle.current_mileage}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="color"
            placeholder="Color"
            value={newVehicle.color}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="vehicle_type"
            placeholder="Vehicle Type"
            value={newVehicle.vehicle_type}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="date"
            name="purchase_date"
            placeholder="Purchase Date"
            value={newVehicle.purchase_date}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="status"
            placeholder="Status"
            value={newVehicle.status}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="engine_type"
            placeholder="Engine Type"
            value={newVehicle.engine_type}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="fuel_type"
            placeholder="Fuel Type"
            value={newVehicle.fuel_type}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="transmission_type"
            placeholder="Transmission Type"
            value={newVehicle.transmission_type}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="seating_capacity"
            placeholder="Seating Capacity"
            value={newVehicle.seating_capacity}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="cargo_volume"
            placeholder="Cargo Volume"
            value={newVehicle.cargo_volume}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              name="insured"
              checked={newVehicle.insured}
              onChange={(e) => setNewVehicle({...newVehicle, insured: e.target.checked})}
              className="mr-2"
            />
            <label className="text-white">Insured</label>
          </div>
          <input
            type="text"
            name="insurance_provider"
            placeholder="Insurance Provider"
            value={newVehicle.insurance_provider}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="insurance_policy_number"
            placeholder="Insurance Policy Number"
            value={newVehicle.insurance_policy_number}
            onChange={handleInputChange}
            className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              name="gps_tracking_enabled"
              checked={newVehicle.gps_tracking_enabled}
              onChange={(e) => setNewVehicle({...newVehicle, gps_tracking_enabled: e.target.checked})}
              className="mr-2"
            />
            <label className="text-white">GPS Tracking Enabled</label>
          </div>
        </div>
        <button
          onClick={handleAddVehicle}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Vehicle
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Vehicles</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left text-white">License Plate</th>
              <th className="p-2 text-left text-white">Make</th>
              <th className="p-2 text-left text-white">Model</th>
              <th className="p-2 text-left text-white">Year</th>
              <th className="p-2 text-left text-white">Status</th>
              <th className="p-2 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id} className="border-b border-gray-600">
                <td className="p-2 text-white">{vehicle.license_plate}</td>
                <td className="p-2 text-white">{vehicle.make}</td>
                <td className="p-2 text-white">{vehicle.model}</td>
                <td className="p-2 text-white">{vehicle.year}</td>
                <td className="p-2 text-white">{vehicle.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEditClick(vehicle)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingVehicle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800">
            <h3 className="text-lg font-medium leading-6 text-white mb-2">Edit Vehicle</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditVehicle(editingVehicle.id, editingVehicle);
            }}>
              {Object.keys(editingVehicle).map((key) => {
                if (key !== 'id') {
                  return (
                    <div key={key} className="mb-4">
                      <label className="block text-sm font-medium text-gray-300">{key}</label>
                      <input
                        type="text"
                        name={key}
                        value={editingVehicle[key]}
                        onChange={(e) => setEditingVehicle({...editingVehicle, [key]: e.target.value})}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  );
                }
                return null;
              })}
              <div className="mt-4">
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2">
                  Save
                </button>
                <button onClick={() => setEditingVehicle(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVehicles;