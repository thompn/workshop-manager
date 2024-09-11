import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllTools, getToolsByCategory, getAllLocations, addNewTool, updateTool, deleteTool } from '../firebaseOperations';
import { FaPlus, FaMinus, FaEdit } from 'react-icons/fa';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 10;
  const [expandedTool, setExpandedTool] = useState(null);

  const renderToolForm = (tool, setTool, onSubmit, submitButtonText) => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(tool);
      }} className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        {Object.keys(tool).map((key) => {
          if (key === 'id' || key === 'asset_tag') return null;
          return (
            <div key={key} className="mb-2">
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
              </label>
              <input
                type={key === 'cost' || key === 'quantity' ? 'number' : key.includes('date') ? 'date' : 'text'}
                id={key}
                name={key}
                value={tool[key]}
                onChange={(e) => setTool({ ...tool, [key]: e.target.value })}
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          );
        })}
        <div className="col-span-2">
          <button type="submit" className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
            {submitButtonText}
          </button>
        </div>
      </form>
    );
  };

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
      const newAssetTag = await generateAssetTag();
      const toolWithAssetTag = { ...newTool, asset_tag: newAssetTag };
      await addNewTool(toolWithAssetTag);
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

  const generateAssetTag = async () => {
    const toolsData = await getAllTools();
    const existingAssetTags = toolsData.map(tool => parseInt(tool.asset_tag));
    const maxAssetTag = Math.max(...existingAssetTags, 0);
    return (maxAssetTag + 1).toString().padStart(6, '0');
  };

  const handleEditTool = async (id, updatedTool) => {
    try {
      await updateTool(id, updatedTool);
      await fetchTools();
      setEditingTool(null);
      setExpandedTool(null);
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

  const indexOfLastTool = currentPage * toolsPerPage;
  const indexOfFirstTool = indexOfLastTool - toolsPerPage;
  const currentTools = tools.slice(indexOfFirstTool, indexOfLastTool);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditClick = (toolId) => {
    const toolToEdit = tools.find(tool => tool.id === toolId);
    setEditingTool(toolToEdit);
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Tools</h1>
        <Link to="/tools" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Inventory
        </Link>
      </div>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
      >
        {showAddForm ? <FaMinus className="mr-2" /> : <FaPlus className="mr-2" />}
        {showAddForm ? 'Hide Add Form' : 'Add New Tool'}
      </button>

      {showAddForm && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow transition-all duration-300 ease-in-out">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Tool</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(newTool).map(([key, value]) => (
              key !== 'asset_tag' && (
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
              )
            ))}
          </div>
          <button
            onClick={newTool.id ? () => handleEditTool(newTool.id, newTool) : handleAddTool}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {newTool.id ? 'Update Tool' : 'Add Tool'}
          </button>
        </div>
      )}

      {/* List of existing tools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold p-4">Existing Tools</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Asset Tag</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTools.map(tool => (
              <React.Fragment key={tool.id}>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-2">{tool.asset_tag}</td>
                  <td className="p-2">{tool.name}</td>
                  <td className="p-2">{tool.category}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEditClick(tool.id)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteTool(tool.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedTool === tool.id && (
                  <tr>
                    <td colSpan="5">
                      <div className={`bg-gray-100 dark:bg-gray-800 p-4 transition-all duration-300 ${expandedTool === tool.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {renderToolForm(
                          editingTool,
                          setEditingTool,
                          (updatedTool) => handleEditTool(updatedTool.id, updatedTool),
                          "Save Changes"
                        )}
                        <button
                          onClick={() => setExpandedTool(null)}
                          className="mt-4 ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-center">
        {Array.from({ length: Math.ceil(tools.length / toolsPerPage) }, (_, i) => (
          <button
            key={i}
            onClick={() => paginate(i + 1)}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ManageTools;
