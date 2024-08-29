import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getAllParts, getPartsByCategory, getPartsLowOnStock } from '../firebaseOperations';

const Parts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [category, setCategory] = useState('all');
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchParts();
  }, [category]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      let partsData;
      if (category === 'all') {
        partsData = await getAllParts();
      } else if (category === 'low_stock') {
        partsData = await getPartsLowOnStock(10); // Assuming 10 as the threshold
      } else {
        partsData = await getPartsByCategory(category);
      }
      setParts(partsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(partsData.map(part => part.category))];
      setCategories(['all', 'low_stock', ...uniqueCategories]);
    } catch (error) {
      console.error("Error fetching parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const itemsPerPage = 10;

  const filteredParts = parts.filter(part => 
    part.part_number_oem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return <div className="text-center mt-8">Loading parts...</div>;
  }

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
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat === 'low_stock' ? 'Low Stock' : cat}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="p-2 text-left">Part Number (OEM)</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Stock Level</th>
            <th className="p-2 text-left">Cost</th>
            <th className="p-2 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {currentParts.map((part) => (
            <React.Fragment key={part.id}>
              <tr 
                className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleRowClick(part.id)}
              >
                <td className="p-2">{part.part_number_oem}</td>
                <td className="p-2">{part.description}</td>
                <td className="p-2">{part.category}</td>
                <td className="p-2">{part.stock_level}</td>
                <td className="p-2">${part.cost.toFixed(2)}</td>
                <td className="p-2">
                  {expandedRow === part.id ? <FaChevronUp /> : <FaChevronDown />}
                </td>
              </tr>
              {expandedRow === part.id && (
                <tr>
                  <td colSpan="6" className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold mb-2">{part.description} Details</h3>
                    <p><strong>Part Number (Vendor):</strong> {part.part_number_vendor}</p>
                    <p><strong>Reorder Threshold:</strong> {part.reorder_threshold}</p>
                    <p><strong>Supplier ID:</strong> {part.supplier_id}</p>
                    <p><strong>Location ID:</strong> {part.location_id}</p>
                    <p><strong>Consumable:</strong> {part.consumable ? 'Yes' : 'No'}</p>
                    <p><strong>Associated Vehicle:</strong> {part.vehicle_id ? `${vehicles.find(v => v.id === part.vehicle_id)?.make} ${vehicles.find(v => v.id === part.vehicle_id)?.model} (${vehicles.find(v => v.id === part.vehicle_id)?.license_plate})` : 'N/A'}</p>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
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
