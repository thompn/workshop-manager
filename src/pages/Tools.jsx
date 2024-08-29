import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaTools, FaWrench, FaCog, FaRuler, FaCar } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Tools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [category, setCategory] = useState('all');

  // Mock data for tools
  const toolsData = [
    { id: 1, name: "Adjustable Wrench", category: "Hand Tools", brand: "Craftsman", model: "AW-10", quantity: 5, location: "Drawer 1", lastMaintenance: "2023-05-15", condition: "Good" },
    { id: 2, name: "Cordless Drill", category: "Power Tools", brand: "DeWalt", model: "DCD777C2", quantity: 2, location: "Shelf 3", lastMaintenance: "2023-04-20", condition: "Excellent" },
    { id: 3, name: "Digital Caliper", category: "Measurement", brand: "Mitutoyo", model: "500-196-30", quantity: 1, location: "Toolbox 2", lastMaintenance: "2023-06-01", condition: "Excellent" },
    { id: 4, name: "Hydraulic Jack", category: "Automotive", brand: "Torin", model: "T83006", quantity: 1, location: "Floor", lastMaintenance: "2023-03-10", condition: "Fair" },
    { id: 5, name: "Screwdriver Set", category: "Hand Tools", brand: "Klein Tools", model: "85078", quantity: 1, location: "Drawer 2", lastMaintenance: "2023-05-30", condition: "Good" },
  ];

  const filteredTools = toolsData.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (category === 'all' || tool.category === category)
  );

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

  return (
    <div>
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
          <option value="all">All Categories</option>
          <option value="Hand Tools">Hand Tools</option>
          <option value="Power Tools">Power Tools</option>
          <option value="Measurement">Measurement</option>
          <option value="Automotive">Automotive</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Brand</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map((tool) => (
              <React.Fragment key={tool.id}>
                <tr 
                  className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleRowClick(tool.id)}
                >
                  <td className="py-2 px-4 flex items-center">
                    <span className="mr-2">{getToolIcon(tool.category)}</span>
                    {tool.name}
                  </td>
                  <td className="py-2 px-4">{tool.category}</td>
                  <td className="py-2 px-4">{tool.brand}</td>
                  <td className="py-2 px-4">{tool.quantity}</td>
                  <td className="py-2 px-4">
                    {expandedRow === tool.id ? <FaChevronUp /> : <FaChevronDown />}
                  </td>
                </tr>
                {expandedRow === tool.id && (
                  <tr>
                    <td colSpan="5" className="p-4 bg-gray-50 dark:bg-gray-900">
                      <h3 className="text-lg font-semibold mb-2">{tool.name} Details</h3>
                      <p><strong>Model:</strong> {tool.model}</p>
                      <p><strong>Location:</strong> {tool.location}</p>
                      <p><strong>Last Maintenance:</strong> {tool.lastMaintenance}</p>
                      <p><strong>Condition:</strong> {tool.condition}</p>
                      {/* Add more details as needed */}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tools;
