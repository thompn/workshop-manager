import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ManageParts = () => {
  const [parts, setParts] = useState([
    // Copy the partsData array from Parts.jsx
  ]);

  const [newPart, setNewPart] = useState({
    name: '',
    category: '',
    quantity: 0,
    price: 0
  });

  const handleInputChange = (e) => {
    setNewPart({ ...newPart, [e.target.name]: e.target.value });
  };

  const handleAddPart = () => {
    setParts([...parts, { ...newPart, id: Date.now() }]);
    setNewPart({
      name: '',
      category: '',
      quantity: 0,
      price: 0
    });
  };

  const handleEditPart = (id, updatedPart) => {
    setParts(parts.map(part => part.id === id ? updatedPart : part));
  };

  const handleDeletePart = (id) => {
    setParts(parts.filter(part => part.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Parts</h1>
        <Link to="/parts" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Parts
        </Link>
      </div>

      {/* Form to add new part */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add New Part</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newPart.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={newPart.category}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={newPart.quantity}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={newPart.price}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleAddPart}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Part
        </button>
      </div>

      {/* List of existing parts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Parts</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} className="border-b dark:border-gray-700">
                <td className="p-2">{part.name}</td>
                <td className="p-2">{part.category}</td>
                <td className="p-2">{part.quantity}</td>
                <td className="p-2">${part.price.toFixed(2)}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEditPart(part.id, { ...part, name: 'Edited ' + part.name })}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id)}
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

export default ManageParts;
