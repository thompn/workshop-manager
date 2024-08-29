import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ManageTools = () => {
  const [tools, setTools] = useState([
    // ... (copy the toolsData array from Tools.jsx)
  ]);

  const [newTool, setNewTool] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    quantity: 0,
    location: '',
    lastMaintenance: '',
    condition: ''
  });

  const handleInputChange = (e) => {
    setNewTool({ ...newTool, [e.target.name]: e.target.value });
  };

  const handleAddTool = () => {
    setTools([...tools, { ...newTool, id: Date.now() }]);
    setNewTool({
      name: '',
      category: '',
      brand: '',
      model: '',
      quantity: 0,
      location: '',
      lastMaintenance: '',
      condition: ''
    });
  };

  const handleEditTool = (id, updatedTool) => {
    setTools(tools.map(tool => tool.id === id ? updatedTool : tool));
  };

  const handleDeleteTool = (id) => {
    setTools(tools.filter(tool => tool.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Tools</h1>
        <Link to="/tools" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Inventory
        </Link>
      </div>

      {/* Form to add new tool */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Add New Tool</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newTool.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={newTool.category}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />
          {/* Add more input fields for other tool properties */}
        </div>
        <button
          onClick={handleAddTool}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Add Tool
        </button>
      </div>

      {/* List of existing tools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Tools</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map(tool => (
              <tr key={tool.id} className="border-b dark:border-gray-700">
                <td className="p-2">{tool.name}</td>
                <td className="p-2">{tool.category}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEditTool(tool.id, { ...tool, name: 'Edited ' + tool.name })}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
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

export default ManageTools;
