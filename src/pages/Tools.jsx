import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaTools, FaWrench, FaCog, FaRuler, FaCar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getAllTools, getToolsByCategory, getAllLocations } from '../firebaseOperations';

const Tools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [category, setCategory] = useState('all');
  const [tools, setTools] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['all']);
  const [manufacturer, setManufacturer] = useState('all');
  const [manufacturers, setManufacturers] = useState(['all']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [toolsData, locationsData] = await Promise.all([
          fetchTools(),
          fetchLocations()
        ]);

        setTools(toolsData);
        setLocations(locationsData);

        const uniqueCategories = ['all', ...new Set(toolsData.map(tool => tool.category))];
        const uniqueManufacturers = ['all', ...new Set(toolsData.map(tool => tool.manufacturer))];
        setCategories(uniqueCategories);
        setManufacturers(uniqueManufacturers);

        // Sort tools by asset_tag
        const sortedTools = toolsData.sort((a, b) => a.asset_tag.localeCompare(b.asset_tag));
        setTools(sortedTools);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, manufacturer]);

  const fetchTools = async () => {
    try {
      let toolsData = await getAllTools();
      if (category !== 'all') {
        toolsData = toolsData.filter(tool => tool.category === category);
      }
      if (manufacturer !== 'all') {
        toolsData = toolsData.filter(tool => tool.manufacturer === manufacturer);
      }
      return toolsData;
    } catch (error) {
      console.error("Error fetching tools:", error);
      return [];
    }
  };

  const fetchLocations = async () => {
    try {
      return await getAllLocations();
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  };

  const getToolIcon = (category) => {
    switch (category) {
      case 'Hand Tools': return <FaWrench />;
      case 'Power Tools': return <FaCog />;
      case 'Measurement': return <FaRuler />;
      case 'Automotive': return <FaCar />;
      default: return <FaTools />;
    }
  };

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (category === 'all' || tool.category === category)
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const currentTools = filteredTools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="text-center mt-8">Loading tools...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workshop Tools Inventory</h1>
        <Link to="/tools/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Inventory
        </Link>
      </div>
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
        <select
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
        >
          {manufacturers.map((manu) => (
            <option key={manu} value={manu}>{manu === 'all' ? 'All Manufacturers' : manu}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-2 px-4 text-left">Asset Tag</th>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Manufacturer</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Location</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTools.map((tool) => (
              <React.Fragment key={tool.id}>
                <tr 
                  className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleRowClick(tool.id)}
                >
                  <td className="py-2 px-4">{tool.asset_tag}</td>
                  <td className="py-2 px-4 flex items-center">
                    <span className="mr-2">{getToolIcon(tool.category)}</span>
                    {tool.name}
                  </td>
                  <td className="py-2 px-4">{tool.manufacturer}</td>
                  <td className="py-2 px-4">{tool.type}</td>
                  <td className="py-2 px-4">{tool.category}</td>
                  <td className="py-2 px-4">
                    {tool.location_id ? (
                      <Link to={`/locations/${tool.location_id}`} className="text-blue-500 hover:text-blue-700">
                        {getLocationName(tool.location_id)}
                      </Link>
                    ) : 'N/A'}
                  </td>
                  <td className="py-2 px-4">{tool.quantity}</td>
                  <td className="py-2 px-4">
                    {expandedRow === tool.id ? <FaChevronUp /> : <FaChevronDown />}
                  </td>
                </tr>
                {expandedRow === tool.id && (
                  <tr>
                    <td colSpan="8" className="p-4 bg-gray-50 dark:bg-gray-900">
                      <h3 className="text-lg font-semibold mb-2">{tool.name} Details</h3>
                      <p><strong>Size:</strong> {tool.size || 'N/A'}</p>
                      <p><strong>Invoice Number:</strong> {tool.invoice_number || 'N/A'}</p>
                      <p><strong>Cost:</strong> {typeof tool.cost === 'number' ? `$${tool.cost.toFixed(2)}` : 'N/A'}</p>
                      <p><strong>Last Maintenance:</strong> {tool.last_maintenance_date ? new Date(tool.last_maintenance_date).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Next Maintenance Due:</strong> {tool.next_maintenance_due ? new Date(tool.next_maintenance_due).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Condition:</strong> {tool.condition || 'N/A'}</p>
                      <p><strong>Notes:</strong> {tool.notes || 'N/A'}</p>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
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
  );
};

export default Tools;
