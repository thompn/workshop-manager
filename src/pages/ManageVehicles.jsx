import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ManageVehicles = () => {
  const [vehicles, setVehicles] = useState([
    // Copy the vehicles array from Vehicles.jsx
  ]);

  const [newVehicle, setNewVehicle] = useState({
    name: '',
    mileage: 0,
    vin: '',
    type: ''
  });

  const handleInputChange = (e) => {
    setNewVehicle({ ...newVehicle, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { ...newVehicle, id: Date.now() }]);
    setNewVehicle({
      name: '',
      mileage: 0,
      vin: '',
      type: ''
    });
  };

  const handleEditVehicle = (id, updatedVehicle) => {
    setVehicles(vehicles.map(vehicle => vehicle.id === id ? updatedVehicle : vehicle));
  };

  const handleDeleteVehicle = (id) => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Vehicles</h1>
        <Link to="/vehicles" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Vehicles
        </Link>
      </div>

      {/* Form to add new vehicle */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add New Vehicle</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newVehicle.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="mileage"
            placeholder="Mileage"
            value={newVehicle.mileage}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          {/* Add more input fields for other vehicle properties */}
        </div>
        <button
          onClick={handleAddVehicle}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Vehicle
        </button>
      </div>

      {/* List of existing vehicles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Vehicles</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id} className="border-b dark:border-gray-700">
                <td className="p-2">{vehicle.name}</td>
                <td className="p-2">{vehicle.type}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEditVehicle(vehicle.id, { ...vehicle, name: 'Edited ' + vehicle.name })}
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
    </div>
  );
};

export default ManageVehicles;