import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllTools, getToolsByCategory, getAllLocations, addNewTool, updateTool, deleteTool } from '../firebaseOperations';

const ManageTools = () => {
  const [tools, setTools] = useState([
    // ... (copy the toolsData array from Tools.jsx)
  ]);

  const [newTool, setNewTool] = useState({
    name: '',
    manufacturer: '',
    type: '',
    category: '',
    location_id: '',
    size: '',
    invoice_number: '',
    cost: 0,
    quantity: 0,
    last_maintenance_date: '',
    next_maintenance_due: '',
    condition: '',
    notes: ''
  });

  const [locations, setLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [editingTool, setEditingTool] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toolsData, locationsData] = await Promise.all([
          getAllTools(),
          getAllLocations()
        ]);
        setTools(toolsData);
        setLocations(locationsData);
        setFilteredLocations(locationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setNewTool({ ...newTool, [e.target.name]: e.target.value });
  };

  const handleLocationSearch = (e) => {
    const searchTerm = e.target.value;
    setLocationSearch(searchTerm);
    const filtered = locations.filter(location => 
      location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  const handleAddTool = async () => {
    try {
      await addNewTool(newTool);
      setNewTool({
        name: '',
        manufacturer: '',
        type: '',
        category: '',
        location_id: '',
        size: '',
        invoice_number: '',
        cost: 0,
        quantity: 0,
        last_maintenance_date: '',
        next_maintenance_due: '',
        condition: '',
        notes: ''
      });
      await fetchTools();
    } catch (error) {
      console.error("Error adding tool:", error);
      alert(`Failed to add tool: ${error.message}`);
    }
  };

  const handleEditTool = async (id, updatedTool) => {
    try {
      await updateTool(id, updatedTool);
      await fetchTools();
      alert("Tool updated successfully!");
    } catch (error) {
      console.error("Error updating tool:", error);
      alert(`Failed to update tool: ${error.message}`);
    }
  };

  const handleDeleteTool = async (id) => {
    try {
      await deleteTool(id);
      await fetchTools();
    } catch (error) {
      console.error("Error deleting tool:", error);
      alert(`Failed to delete tool: ${error.message}`);
    }
  };

  const fetchTools = async () => {
    try {
      const toolsData = await getAllTools();
      setTools(toolsData);
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Tools</h1>
        <Link to="/tools" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Inventory
        </Link>
      </div>

      {/* Form to add new tool */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Tool</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(newTool).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <label htmlFor={key} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </label>
              {key === 'location_id' ? (
                <div className="relative">
                  <input
                    type="text"
                    id={`${key}_search`}
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={handleLocationSearch}
                    className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  <select
                    id={key}
                    name={key}
                    value={value}
                    onChange={handleInputChange}
                    className="mt-2 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="">Select Location</option>
                    {filteredLocations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type={key.includes('date') ? 'date' : key === 'cost' || key === 'quantity' ? 'number' : 'text'}
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={newTool.id ? () => handleEditTool(newTool.id, newTool) : handleAddTool}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          {newTool.id ? 'Update Tool' : 'Add Tool'}
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
