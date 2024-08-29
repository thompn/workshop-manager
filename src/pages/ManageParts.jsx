import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewPart, getAllParts, updatePart, deletePart, getAllVehicles } from '../firebaseOperations';

const ManageParts = () => {
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
    part_number_oem: '',
    part_number_vendor: '',
    description: '',
    category: '',
    cost: 0,
    stock_level: 0,
    reorder_threshold: 0,
    supplier_id: '',
    location_id: '',
    consumable: false,
    vehicle_id: ''
  });
  const [editingPart, setEditingPart] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchParts();
    fetchVehicles();
  }, []);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleInputChange = (e, partState, setPartState) => {
    const { name, value, type, checked } = e.target;
    setPartState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Math.max(0, parseFloat(value) || 0) : value
    }));
  };

  const handleAddPart = async () => {
    try {
      await addNewPart(newPart);
      setNewPart({
        part_number_oem: '',
        part_number_vendor: '',
        description: '',
        category: '',
        cost: 0,
        stock_level: 0,
        reorder_threshold: 0,
        supplier_id: '',
        location_id: '',
        consumable: false,
        vehicle_id: ''
      });
      fetchParts();
    } catch (error) {
      console.error("Error adding part:", error);
    }
  };

  const handleEditPart = async () => {
    if (!editingPart) return;
    try {
      await updatePart(editingPart.id, editingPart);
      setEditingPart(null);
      fetchParts();
    } catch (error) {
      console.error("Error updating part:", error);
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await deletePart(id);
      fetchParts();
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const renderPartForm = (part, setPart, submitHandler, buttonText) => (
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        name="part_number_oem"
        placeholder="OEM Part Number"
        value={part.part_number_oem}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="text"
        name="part_number_vendor"
        placeholder="Vendor Part Number"
        value={part.part_number_vendor}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={part.description}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="text"
        name="category"
        placeholder="Category"
        value={part.category}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="number"
        name="cost"
        placeholder="Cost"
        value={part.cost}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="number"
        name="stock_level"
        placeholder="Stock Level"
        value={part.stock_level}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="number"
        name="reorder_threshold"
        placeholder="Reorder Threshold"
        value={part.reorder_threshold}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="text"
        name="supplier_id"
        placeholder="Supplier ID"
        value={part.supplier_id}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="text"
        name="location_id"
        placeholder="Location ID"
        value={part.location_id}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          name="consumable"
          checked={part.consumable}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="mr-2"
        />
        <label htmlFor="consumable" className="text-gray-800 dark:text-white">Consumable</label>
      </div>
      <select
        name="vehicle_id"
        value={part.vehicle_id}
        onChange={(e) => handleInputChange(e, part, setPart)}
        className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
      >
        <option value="">Select Vehicle (Optional)</option>
        {vehicles.map(vehicle => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.make} {vehicle.model} ({vehicle.license_plate})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Parts</h1>
        <Link to="/parts" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Parts
        </Link>
      </div>

      {/* Form to add new part */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Part</h2>
        {renderPartForm(newPart, setNewPart, handleAddPart, "Add Part")}
        <button
          onClick={handleAddPart}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Part
        </button>
      </div>

      {/* List of existing parts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 p-4 text-gray-800 dark:text-white">Existing Parts</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left text-gray-800 dark:text-white">Part Number (OEM)</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Description</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Category</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Stock Level</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Vehicle</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-2 text-gray-800 dark:text-white">{part.part_number_oem}</td>
                <td className="p-2 text-gray-800 dark:text-white">{part.description}</td>
                <td className="p-2 text-gray-800 dark:text-white">{part.category}</td>
                <td className="p-2 text-gray-800 dark:text-white">{part.stock_level}</td>
                <td className="p-2 text-gray-800 dark:text-white">
                  {vehicles.find(v => v.id === part.vehicle_id)?.license_plate || 'N/A'}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => setEditingPart(part)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit part form */}
      {editingPart && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Edit Part</h2>
          {renderPartForm(editingPart, setEditingPart, handleEditPart, "Save Changes")}
          <button
            onClick={handleEditPart}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageParts;