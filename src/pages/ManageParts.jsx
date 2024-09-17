import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewPart, getAllParts, updatePart, deletePart, getAllVehicles, getAllLocations, uploadInvoiceToStorage } from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaSearch } from 'react-icons/fa';
import { getDownloadURL } from 'firebase/storage';
import { naturalSort } from '../utils/naturalSort';

const ManageParts = () => {
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({
    part_number_oem: '',
    part_number_vendor: '',
    description: '',
    category: '',
    cost: 0,
    stock_level: 0,
    reorder_threshold: 0,
    supplier_id: '',
    location_id: '',
    consumable: false,
    vehicle_id: '',
    invoice_number: ''
  });
  const [editingPart, setEditingPart] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locations, setLocations] = useState([]);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedPart, setExpandedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchParts();
    fetchVehicles();
    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const partsData = await getAllParts();
      const uniqueCategories = ['all', ...new Set(partsData.map(part => part.category))];
      setCategories(uniqueCategories);
    };
    fetchCategories();
  }, []);

  const fetchParts = async () => {
    try {
      const partsData = await getAllParts();
      setParts(partsData);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
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

  const handleInputChange = (e, state, setState) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleAddPart = async () => {
    try {
      if (!newPart.part_number_oem || !newPart.description) {
        throw new Error("Part number (OEM) and description are required.");
      }
      await addNewPart(newPart);
      setNewPart({
        part_number_oem: '',
        part_number_vendor: '',
        description: '',
        category: '',
        cost: 0,
        stock_level: 0,
        reorder_threshold: 0,
        supplier_id: '',
        location_id: '',
        consumable: false,
        vehicle_id: '',
        invoice_number: ''
      });
      fetchParts();
      alert("Part added successfully!");
    } catch (error) {
      console.error("Error adding part:", error);
      alert(`Failed to add part: ${error.message}`);
    }
  };

  const handleEditPart = async () => {
    try {
      if (!editingPart.part_number_oem || !editingPart.description) {
        throw new Error("Part number (OEM) and description are required.");
      }
      await updatePart(editingPart.id, editingPart);
      setEditingPart(null);
      fetchParts();
      alert("Part updated successfully!");
    } catch (error) {
      console.error("Error updating part:", error);
      alert(`Failed to update part: ${error.message}`);
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await deletePart(id);
      fetchParts();
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setInvoiceFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const uploadInvoice = async () => {
    if (!invoiceFile || !editingPart.invoice_number) {
      alert('Please select an invoice file to upload and ensure the invoice number is set');
      return;
    }

    try {
      const invoiceRef = await uploadInvoiceToStorage(invoiceFile, editingPart.invoice_number, (progress) => {
        setUploadProgress(progress);
      });
      const invoiceUrl = await getDownloadURL(invoiceRef);
      
      // Update the part with the invoice URL and invoice number
      await updatePart(editingPart.id, { 
        ...editingPart, 
        invoice_url: invoiceUrl,
        invoice_number: editingPart.invoice_number
      });
      
      alert('Invoice uploaded successfully');
      setInvoiceFile(null);
      setUploadProgress(0);
      fetchParts();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      alert(`Failed to upload invoice: ${error.message}`);
    }
  };

  const renderPartForm = (part, setPart, submitHandler, buttonText) => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { name: "part_number_oem", label: "OEM Part Number", type: "text" },
        { name: "part_number_vendor", label: "Vendor Part Number", type: "text" },
        { name: "description", label: "Description", type: "text" },
        { name: "category", label: "Category", type: "text" },
        { name: "cost", label: "Cost", type: "number" },
        { name: "stock_level", label: "Stock Level", type: "number" },
        { name: "reorder_threshold", label: "Reorder Threshold", type: "number" },
        { name: "location_id", label: "Location ID", type: "text" },
        { name: "invoice_number", label: "Invoice Number", type: "text" },
      ].map((field) => (
        <div key={field.name} className="flex flex-col">
          <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
          </label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={part[field.name]}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      ))}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="consumable"
          name="consumable"
          checked={part.consumable}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="mr-2"
        />
        <label htmlFor="consumable" className="text-gray-800 dark:text-white">Consumable</label>
      </div>
      <div className="flex flex-col">
        <label htmlFor="vehicle_id" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Associated Vehicle
        </label>
        <select
          id="vehicle_id"
          name="vehicle_id"
          value={part.vehicle_id}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        >
          <option value="">Select Vehicle (Optional)</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} ({vehicle.license_plate})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="supplier_id" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Supplier
        </label>
        <select
          id="supplier_id"
          name="supplier_id"
          value={part.supplier_id}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        >
          <option value="">Select Supplier</option>
          {/* {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))} */}
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="location_id" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Location
        </label>
        <select
          id="location_id"
          name="location_id"
          value={part.location_id}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        >
          <option value="">Select Location</option>
          {locations.sort((a, b) => naturalSort(a.name, b.name)).map(location => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label htmlFor="invoice_upload" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload Invoice (PDF)
        </label>
        <input
          type="file"
          id="invoice_upload"
          accept=".pdf"
          onChange={handleFileUpload}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
        {invoiceFile && (
          <button
            onClick={uploadInvoice}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Upload Invoice
          </button>
        )}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${uploadProgress}%` }}>
              {uploadProgress.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const handleEditClick = (partId) => {
    setEditingPart(parts.find(part => part.id === partId));
    setExpandedPart(expandedPart === partId ? null : partId);
  };

  const filteredParts = parts.filter(part => 
    (part.part_number_oem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (category === 'all' || part.category === category)
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const currentParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Parts</h1>
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            {showAddForm ? 'Hide Add Form' : 'Add Part'}
          </button>
          <Link to="/parts" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
            Back to Parts
          </Link>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Part</h2>
          {renderPartForm(newPart, setNewPart, handleAddPart, "Add Part")}
          <button
            onClick={handleAddPart}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Part
          </button>
        </div>
      )}

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
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>
      {/* List of existing parts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 p-4 text-gray-800 dark:text-white">Existing Parts</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left text-gray-800 dark:text-white">Part Number (OEM)</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Description</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Category</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Stock Level</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Vehicle</th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentParts.map(part => (
              <React.Fragment key={part.id}>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-2 text-gray-800 dark:text-white">
                    {/* {part.supplier_id && suppliers.find(s => s.id === part.supplier_id)?.search_url ? (
                      <a
                        href={`${suppliers.find(s => s.id === part.supplier_id).search_url}${part.part_number_oem}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {part.part_number_oem}
                      </a>
                    ) : (
                      part.part_number_oem
                    )} */}
                    {part.part_number_oem}
                  </td>
                  <td className="p-2 text-gray-800 dark:text-white">{part.description}</td>
                  <td className="p-2 text-gray-800 dark:text-white">{part.category}</td>
                  <td className="p-2 text-gray-800 dark:text-white">{part.stock_level}</td>
                  <td className="p-2 text-gray-800 dark:text-white">
                    {vehicles.find(v => v.id === part.vehicle_id)?.license_plate || 'N/A'}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEditClick(part.id)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeletePart(part.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="text-xl" />
                    </button>
                  </td>
                </tr>
                {expandedPart === part.id && (
                  <tr>
                    <td colSpan="6">
                      <div className={`bg-gray-100 dark:bg-gray-800 p-4 transition-all duration-300 ${expandedPart === part.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {renderPartForm(editingPart, setEditingPart, handleEditPart, "Save Changes")}
                        <button
                          onClick={handleEditPart}
                          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setExpandedPart(null)}
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

export default ManageParts;