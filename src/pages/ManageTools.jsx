import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllTools, getToolsByCategory, getAllLocations, addNewTool, updateTool, deleteTool } from '../firebaseOperations';
import { FaPlus, FaMinus, FaEdit, FaSearch, FaTrash } from 'react-icons/fa';
import { naturalSort } from '../utils/naturalSort';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [formToolCategoryOptions, setFormToolCategoryOptions] = useState([]);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  // Define the desired order of fields for the tool form
  const toolFormFields = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
    { name: 'type', label: 'Type', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
    { name: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { name: 'cost', label: 'Cost', type: 'number' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'last_maintenance_date', label: 'Last Maintenance Date', type: 'date' },
    { name: 'next_maintenance_due', label: 'Next Maintenance Due', type: 'date' },
    { name: 'condition', label: 'Condition', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'text' },
  ];

  const renderToolForm = (tool, setTool, onSubmit, submitButtonText) => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(tool);
      }} className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        {toolFormFields.map((field) => (
          <div key={field.name} className="mb-2">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={tool[field.name] || ''}
              onChange={(e) => setTool({ ...tool, [field.name]: e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        ))}
        <div className="flex flex-col mb-2">
          <label htmlFor="edit_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <input
            type="text"
            id="edit_category"
            name="category"
            list="tool-category-datalist"
            value={tool.category || ''}
            onChange={(e) => setTool({ ...tool, category: e.target.value })}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Select or type new category"
          />
        </div>
        <div className="flex flex-col mb-2">
          <label htmlFor="location_id_edit_search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <select
            id="location_id_edit"
            name="location_id"
            value={tool.location_id || ''}
            onChange={(e) => setTool({ ...tool, location_id: e.target.value })}
            className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="">Select Location</option>
            {filteredLocations.sort((a, b) => naturalSort(a.name, b.name)).map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </div>
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
        const [toolsDataResponse, locationsData] = await Promise.all([
          getAllTools(),
          getAllLocations()
        ]);
        setTools(toolsDataResponse);
        setLocations(locationsData);
        setFilteredLocations(locationsData);

        const uniqueToolCategories = [...new Set(toolsDataResponse.map(t => t.category).filter(cat => cat))];
        setCategories(['all', ...uniqueToolCategories.sort((a, b) => a.localeCompare(b))]);
        setFormToolCategoryOptions(uniqueToolCategories.sort((a, b) => a.localeCompare(b)));

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

  const filteredTools = tools.filter(tool => 
    (tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (category === 'all' || tool.category === category) &&
    (!showUnassignedOnly || !tool.location_id)
  );

  const totalPages = Math.ceil(filteredTools.length / toolsPerPage);
  const currentTools = filteredTools.slice((currentPage - 1) * toolsPerPage, currentPage * toolsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditClick = (toolId) => {
    const toolToEdit = tools.find(tool => tool.id === toolId);
    setEditingTool(toolToEdit);
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'N/A';
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
            {toolFormFields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label htmlFor={`new_${field.name}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  id={`new_${field.name}`}
                  name={field.name}
                  value={newTool[field.name] || ''}
                  onChange={handleInputChange}
                  className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
            ))}
            <div className="flex flex-col">
              <label htmlFor="new_category" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <input
                type="text"
                id="new_category"
                name="category"
                list="tool-category-datalist"
                value={newTool.category || ''}
                onChange={handleInputChange}
                className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="Select or type new category"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="new_location_id_search" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <select
                id="new_location_id"
                name="location_id"
                value={newTool.location_id || ''}
                onChange={handleInputChange}
                className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">Select Location</option>
                {filteredLocations.sort((a, b) => naturalSort(a.name, b.name)).map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
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
        <div className="mb-6 flex space-x-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full p-2 pl-8 pr-4 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <div className="flex items-center ml-4">
            <input
              type="checkbox"
              id="showUnassignedManageToolsOnly"
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
              className="mr-2 h-4 w-4 bg-white rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:checked:bg-blue-500 dark:checked:border-transparent"
            />
            <label htmlFor="showUnassignedManageToolsOnly" className="text-sm text-gray-700 dark:text-gray-300">
              Show unassigned only
            </label>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left">Asset Tag</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Manufacturer</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Location</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTools.map(tool => (
              <React.Fragment key={tool.id}>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-2">{tool.asset_tag}</td>
                  <td className="p-2">{tool.name}</td>
                  <td className="p-2">{tool.manufacturer}</td>
                  <td className="p-2">{tool.type}</td>
                  <td className="p-2">{tool.category}</td>
                  <td className="p-2">
                    {tool.location_id ? (
                      <Link to={`/locations/${tool.location_id}`} className="text-blue-500 hover:text-blue-700">
                        {getLocationName(tool.location_id)}
                      </Link>
                    ) : 'N/A'}
                  </td>
                  <td className="p-2">{tool.quantity}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEditClick(tool.id)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteTool(tool.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="text-xl" />
                    </button>
                  </td>
                </tr>
                {expandedTool === tool.id && (
                  <tr>
                    <td colSpan="8" className="p-4 bg-gray-50 dark:bg-gray-900">
                      {editingTool && editingTool.id === tool.id ? (
                        <>
                          {renderToolForm(
                            editingTool,
                            setEditingTool,
                            () => handleEditTool(editingTool.id, editingTool),
                            "Save Changes"
                          )}
                          <button
                            onClick={() => {
                              setEditingTool(null);
                              setExpandedTool(null);
                            }}
                            className="mt-4 ml-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold mb-2">{tool.name} Details</h3>
                          <p><strong>Size:</strong> {tool.size || 'N/A'}</p>
                          <p><strong>Invoice Number:</strong> {tool.invoice_number || 'N/A'}</p>
                          <p><strong>Cost:</strong> {typeof tool.cost === 'number' ? `$${tool.cost.toFixed(2)}` : 'N/A'}</p>
                          <p><strong>Last Maintenance:</strong> {tool.last_maintenance_date ? new Date(tool.last_maintenance_date).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Next Maintenance Due:</strong> {tool.next_maintenance_due ? new Date(tool.next_maintenance_due).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Condition:</strong> {tool.condition || 'N/A'}</p>
                          <p><strong>Notes:</strong> {tool.notes || 'N/A'}</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex justify-between items-center">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageTools;
