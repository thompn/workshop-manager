import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { 
  getAllParts, 
  getPartsByCategory, 
  getPartsLowOnStock, 
  getAllVehicles, 
  getAllSuppliers, 
  getAllLocations 
} from '../firebaseOperations';

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
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const vehicleIdParam = queryParams.get('vehicleId');
    if (vehicleIdParam) {
      setVehicleId(vehicleIdParam);
      setSelectedVehicle(vehicleIdParam);
    }
  }, [location]);

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partsData, vehiclesData, suppliersData, locationsData] = await Promise.all([
          fetchParts(),
          fetchVehicles(),
          fetchSuppliers(),
          fetchLocations()
        ]);

        setParts(partsData);
        setVehicles(vehiclesData);
        setVehiclesMap(vehiclesData.reduce((map, vehicle) => ({ ...map, [vehicle.id]: vehicle }), {}));
        setSuppliers(suppliersData);
        setLocations(locationsData);

        const uniqueCategories = [...new Set(partsData.map(part => part.category))];
        setCategories(['all', 'low_stock', ...uniqueCategories]);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, selectedVehicle]);

  const fetchParts = async () => {
    try {
      if (category === 'all') return await getAllParts();
      if (category === 'low_stock') return await getPartsLowOnStock(10);
      return await getPartsByCategory(category);
    } catch (error) {
      console.error("Error fetching parts:", error);
      return [];
    }
  };

  const fetchVehicles = async () => {
    try {
      return await getAllVehicles();
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  };

  const fetchSuppliers = async () => {
    try {
      return await getAllSuppliers();
    } catch (error) {
      console.error("Error fetching suppliers:", error);
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

  const itemsPerPage = 10;
  const filteredParts = parts.filter(part => 
    (part.part_number_oem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedVehicle || part.vehicle_id === selectedVehicle)
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const currentParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleInvoiceClick = (invoiceUrl) => {
    if (invoiceUrl) {
      setSelectedInvoiceUrl(invoiceUrl);
      setShowInvoicePopup(true);
    }
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
        <select
          className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          <option value="">All Vehicles</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.license_plate})
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
                    return supplier ? (
                      supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                          {supplier.name}
                        </a>
                      ) : supplier.name
                    ) : 'N/A';
                  })()}
                </td>
                <td className="p-2">
                  {part.invoice_url ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInvoiceClick(part.invoice_url);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {part.invoice_number || 'View Invoice'}
                    </button>
                  ) : 'N/A'}
                </td>
                <td className="p-2">
                  {part.location_id ? (
                    <Link to={`/locations/${part.location_id}`} className="text-blue-500 hover:text-blue-700">
                      {getLocationName(part.location_id)}
                    </Link>
                  ) : 'N/A'}
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
                      (() => {const supplier = suppliers.find(s => s.id === part.supplier_id);
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

      {showInvoicePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-3/4 h-3/4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invoice</h2>
              <button
                onClick={() => setShowInvoicePopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <iframe
              src={selectedInvoiceUrl}
              className="w-full h-full"
              title="Invoice PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Parts;
