import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewPart, getAllParts, updatePart, deletePart } from '../firebaseOperations';

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
    consumable: false
  });
  const [editingPart, setEditingPart] = useState(null);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const handleInputChange = (e, partState, setPartState) => {
    const { name, value, type, checked } = e.target;
    setPartState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
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
        consumable: false
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
      {Object.entries(part).map(([key, value]) => (
        key !== 'id' && (
          <div key={key} className="relative group">
            {key === 'consumable' ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name={key}
                  checked={value}
                  onChange={(e) => handleInputChange(e, part, setPart)}
                  className="mr-2 bg-gray-700 border-gray-600 rounded"
                />
                <label className="text-white">{formatFieldName(key)}</label>
              </div>
            ) : (
              <>
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  name={key}
                  placeholder={formatFieldName(key)}
                  value={value}
                  onChange={(e) => handleInputChange(e, part, setPart)}
                  min={typeof value === 'number' ? 0 : undefined}
                  className="p-2 border rounded bg-gray-700 text-white placeholder-gray-400 w-full"
                />
                <div className="absolute hidden group-hover:block bg-gray-800 text-white p-2 rounded shadow-lg z-10 -mt-2 ml-2">
                  {formatFieldName(key)}
                </div>
              </>
            )}
          </div>
        )
      ))}
    </div>
  );

  const formatFieldName = (fieldName) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Parts</h1>
        <Link to="/parts" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Parts
        </Link>
      </div>

      {/* Form to add new part */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add New Part</h2>
        {renderPartForm(newPart, setNewPart, handleAddPart, "Add Part")}
        <button
          onClick={handleAddPart}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Part
        </button>
      </div>

      {/* List of existing parts */}
      <div className="bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Parts</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Part Number (OEM)</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Stock Level</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} className="border-b border-gray-700">
                <td className="p-2">{part.part_number_oem}</td>
                <td className="p-2">{part.description}</td>
                <td className="p-2">{part.category}</td>
                <td className="p-2">{part.stock_level}</td>
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
        <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Edit Part</h2>
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
