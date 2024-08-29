import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Parts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [category, setCategory] = useState('all');

  // Mock data - replace with actual data from backend later
  const partsData = [
    { id: 1, name: 'Spark Plug', category: 'Engine', quantity: 50, price: 9.99 },
    { id: 2, name: 'Oil Filter', category: 'Engine', quantity: 30, price: 14.99 },
    { id: 3, name: 'Brake Pad', category: 'Brakes', quantity: 20, price: 39.99 },
    { id: 4, name: 'Air Filter', category: 'Engine', quantity: 25, price: 19.99 },
    { id: 5, name: 'Timing Belt', category: 'Engine', quantity: 10, price: 29.99 },
    // Add more mock data here...
  ];

  const itemsPerPage = 10;

  const filteredParts = partsData.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (category === 'all' || part.category === category)
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parts Inventory</h1>
        <Link to="/parts/manage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Manage Parts
        </Link>
      </div>
      
      <div className="mb-6 flex space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search parts..."
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
          <option value="Engine">Engine</option>
          <option value="Brakes">Brakes</option>
          {/* Add more categories as needed */}
        </select>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Quantity</th>
            <th className="p-2 text-left">Price</th>
          </tr>
        </thead>
        <tbody>
          {currentParts.map((part) => (
            <React.Fragment key={part.id}>
              <tr 
                className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleRowClick(part.id)}
              >
                <td className="p-2">{part.name}</td>
                <td className="p-2">{part.category}</td>
                <td className="p-2">{part.quantity}</td>
                <td className="p-2">${part.price.toFixed(2)}</td>
                <td className="p-2">
                  {expandedRow === part.id ? <FaChevronUp /> : <FaChevronDown />}
                </td>
              </tr>
              {expandedRow === part.id && (
                <tr>
                  <td colSpan="5" className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold mb-2">{part.name} Details</h3>
                    <p><strong>ID:</strong> {part.id}</p>
                    <p><strong>Description:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    <p><strong>Manufacturer:</strong> Example Manufacturer</p>
                    <p><strong>Compatibility:</strong> Various models (check specific vehicle requirements)</p>
                    {/* Add more details as needed */}
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
  );
};

export default Parts;
