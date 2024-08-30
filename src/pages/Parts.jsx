import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getAllParts, getPartsByCategory, getPartsLowOnStock, getAllVehicles, getAllSuppliers, getAllLocations } from '../firebaseOperations';

const Parts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [category, setCategory] = useState('all');
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesMap, setVehiclesMap] = useState({});
  const [locations, setLocations] = useState([]);

  const formatCost = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getAssociatedVehicle = (vehicleId) => {
    const vehicle = vehiclesMap[vehicleId];
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Unknown';
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  useEffect(() => {
    fetchParts();
    fetchVehicles();
    fetchSuppliers();
    fetchLocations();
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

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      const vehiclesMapData = {};
      vehiclesData.forEach(vehicle => {
        vehiclesMapData[vehicle.id] = vehicle;
      });
      setVehiclesMap(vehiclesMapData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getAllSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const locationsData = await getAllLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
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

      <table className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200 dark:bg-gray-700">
          <tr>
            <th className="p-2 text-left">Part Number (OEM)</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Stock Level</th>
            <th className="p-2 text-left">Supplier</th>
            <th className="p-2 text-left">Invoice Number</th>
            <th className="p-2 text-left">Location</th>
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
                <td className="p-2">
                  {(() => {
                    const supplier = suppliers.find(s => s.id === part.supplier_id);
                    if (supplier) {
                      return supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                          {supplier.name}
                        </a>
                      ) : supplier.name;
                    }
                    return 'N/A';
                  })()}
                </td>
                <td className="p-2">{part.invoice_number || 'N/A'}</td>
                <td className="p-2">
                  {part.location_id ? (
                    <Link to={`/locations/${part.location_id}`} className="text-blue-500 hover:text-blue-700">
                      {getLocationName(part.location_id)}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="p-2">
                  {expandedRow === part.id ? <FaChevronUp /> : <FaChevronDown />}
                </td>
              </tr>
              {expandedRow === part.id && (
                <tr>
                  <td colSpan="7" className="p-4 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold mb-2">{part.description} Details</h3>
                    <p><strong>Part Number (Vendor):</strong> {part.part_number_vendor}</p>
                    <p><strong>Reorder Threshold:</strong> {part.reorder_threshold}</p>
                    <p><strong>Supplier:</strong> {
                      (() => {
                        const supplier = suppliers.find(s => s.id === part.supplier_id);
                        if (supplier) {
                          return supplier.website ? (
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              {supplier.name}
                            </a>
                          ) : supplier.name;
                        }
                        return 'N/A';
                      })()
                    }</p>
                    <p><strong>Location ID:</strong> {part.location_id}</p>
                    <p><strong>Consumable:</strong> {part.consumable ? 'Yes' : 'No'}</p>
                    <p><strong>Associated Vehicle:</strong> {part.vehicle_id ? getAssociatedVehicle(part.vehicle_id) : 'N/A'}</p>
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
