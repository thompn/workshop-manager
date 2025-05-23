import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllParts, addNewPart, updatePart, deletePart, getAllVehicles, getAllLocations, uploadInvoiceToStorage, getPartsByCategory, getAllSuppliers } from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaSearch } from 'react-icons/fa';
import { getDownloadURL } from 'firebase/storage';
import { naturalSort } from '../utils/naturalSort';
import { useNotification } from '../contexts/NotificationContext';
import PartsToOrderTabContent from '../components/PartsToOrderTabContent';
import CreateTaskFromPartsModal from '../components/CreateTaskFromPartsModal';

const ManageParts = () => {
  const { showNotification } = useNotification();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const vehicleIdFilter = useMemo(() => queryParams.get('vehicleId'), [queryParams]);

  const [activeTab, setActiveTab] = useState('mainInventory');
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
  const [suppliers, setSuppliers] = useState([]);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedPart, setExpandedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [formCategoryOptions, setFormCategoryOptions] = useState([]);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [vehicleNameFilter, setVehicleNameFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // State for main inventory part selection and task modal
  const [selectedMainPartIds, setSelectedMainPartIds] = useState(new Set());
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Effect to handle tab switching from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Optional: clear the state from location to prevent re-triggering on refresh/other navigation
      // navigate(location.pathname, { replace: true, state: {} }); 
      // For now, let's keep it simple. If issues arise, this can be added.
    }
  }, [location.state]);

  const { data: parts, isLoading, error } = useQuery(
    ['parts', category],
    () => category === 'all' ? getAllParts() : getPartsByCategory(category),
    {
      staleTime: 300000, // 5 minutes
      cacheTime: 3600000, // 1 hour
    }
  );

  const addPartMutation = useMutation(addNewPart, {
    onSuccess: () => {
      queryClient.invalidateQueries('parts');
    },
  });

  const updatePartMutation = useMutation(
    (variables) => updatePart(variables.id, variables.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parts');
      },
    }
  );

  const deletePartMutation = useMutation(deletePart, {
    onSuccess: () => {
      queryClient.invalidateQueries('parts');
    },
  });

  useEffect(() => {
    fetchVehicles();
    fetchLocations();
    fetchSuppliers();

    if (vehicleIdFilter) {
      const fetchVehicleName = async () => {
        try {
          const vehicleData = await getAllVehicles();
          const specificVehicle = vehicleData.find(v => v.id === vehicleIdFilter);
          if (specificVehicle) {
            setVehicleNameFilter(`${specificVehicle.make} ${specificVehicle.model} (${specificVehicle.license_plate || specificVehicle.vin})`);
          } else {
            setVehicleNameFilter(`ID: ${vehicleIdFilter}`);
          }
        } catch (error) {
          console.error("Error fetching vehicle name for filter:", error);
          setVehicleNameFilter(`ID: ${vehicleIdFilter}`);
        }
      };
      fetchVehicleName();
    } else {
      setVehicleNameFilter('');
    }
  }, [vehicleIdFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      const partsData = await getAllParts();
      const uniqueCategoriesFromParts = [...new Set(partsData.map(part => part.category).filter(cat => cat))];
      
      setCategories(['all', ...uniqueCategoriesFromParts.sort((a, b) => a.localeCompare(b))]);
      
      setFormCategoryOptions(uniqueCategoriesFromParts.sort((a, b) => a.localeCompare(b)));
    };
    fetchCategories();
  }, [parts]);

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

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getAllSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleInputChange = (e, state, setState) => {
    const { name, value, type, checked } = e.target;
    const oldState = { ...state }; // Capture the old state before updating

    setState(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value
      };

      // Auto-populate part_number_vendor from part_number_oem for newPart
      if (setState === setNewPart && name === 'part_number_oem') {
        // Only update if part_number_vendor was empty or same as old part_number_oem
        if (oldState.part_number_vendor === '' || oldState.part_number_vendor === oldState.part_number_oem) {
          newState.part_number_vendor = value;
        }
      }
      return newState;
    });
  };

  const handleAddPart = async () => {
    try {
      if (!newPart.part_number_oem || !newPart.description) {
        showNotification("Part number (OEM) and description are required.", "error");
        return;
      }
      await addPartMutation.mutateAsync(newPart);
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
      showNotification("Part added successfully!", "success");
    } catch (error) {
      console.error("Error adding part:", error);
      showNotification(`Failed to add part: ${error.message}`, "error");
    }
  };

  const handleEditPart = async () => {
    try {
      if (!editingPart.part_number_oem || !editingPart.description) {
        showNotification("Part number (OEM) and description are required.", "error");
        return;
      }
      await updatePartMutation.mutateAsync({ id: editingPart.id, payload: editingPart });
      setEditingPart(null);
      setExpandedPart(null);
      showNotification("Part updated successfully!", "success");
    } catch (error) {
      console.error("Error updating part. Data sent was:", JSON.stringify(editingPart, null, 2));
      console.error("Full error object:", error);
      showNotification(`Failed to update part: ${error.message}`, "error");
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await deletePartMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting part:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setInvoiceFile(file);
    } else {
      showNotification('Please select a PDF file', "error");
    }
  };

  const uploadInvoice = async () => {
    if (!invoiceFile || !editingPart.invoice_number) {
      showNotification('Please select an invoice file to upload and ensure the invoice number is set', "error");
      return;
    }

    try {
      const invoiceRef = await uploadInvoiceToStorage(invoiceFile, editingPart.invoice_number, (progress) => {
        setUploadProgress(progress);
      });
      const invoiceUrl = await getDownloadURL(invoiceRef);
      
      // Update the part with the invoice URL and invoice number
      await updatePartMutation.mutateAsync({ 
        id: editingPart.id, 
        payload: { 
          ...editingPart, 
          invoice_url: invoiceUrl,
          invoice_number: editingPart.invoice_number
        }
      });
      
      showNotification('Invoice uploaded successfully', "success");
      setInvoiceFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading invoice:', error);
      showNotification(`Failed to upload invoice: ${error.message}`, "error");
    }
  };

  const renderPartForm = (part, setPart, submitHandler, buttonText) => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { name: "part_number_oem", label: "OEM Part Number", type: "text" },
        { name: "part_number_vendor", label: "Vendor Part Number", type: "text" },
        { name: "description", label: "Description", type: "text" },
        { name: "cost", label: "Cost", type: "number" },
        { name: "stock_level", label: "Stock Level", type: "number" },
        { name: "reorder_threshold", label: "Reorder Threshold", type: "number" },
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
            value={part[field.name] || ''}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      ))}
      <div className="flex flex-col">
        <label htmlFor="category" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <input
          type="text"
          id="category"
          name="category"
          list="category-datalist"
          value={part.category || ''}
          onChange={(e) => handleInputChange(e, part, setPart)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Select or type new category"
        />
        <datalist id="category-datalist">
          {formCategoryOptions.map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>
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
          {suppliers.sort((a, b) => naturalSort(a.name, b.name)).map(supplier => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
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

  const handleSelectMainPart = (partId) => {
    setSelectedMainPartIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(partId)) {
        newSelectedIds.delete(partId);
      } else {
        newSelectedIds.add(partId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAllMainParts = () => {
    if (selectedMainPartIds.size === filteredParts.length) {
      setSelectedMainPartIds(new Set());
    } else {
      setSelectedMainPartIds(new Set(filteredParts.map(p => p.id)));
    }
  };

  const filteredParts = useMemo(() => {
    if (!parts) return [];
    let processedParts = parts;

    if (vehicleIdFilter) {
      processedParts = processedParts.filter(part => part.vehicle_id === vehicleIdFilter);
    }

    if (showUnassignedOnly) {
      processedParts = processedParts.filter(part => !part.vehicle_id || part.vehicle_id === '');
    }

    if (supplierFilter) {
      processedParts = processedParts.filter(part => part.supplier_id === supplierFilter);
    }

    if (searchTerm) {
      processedParts = processedParts.filter(part =>
        (part.part_number_oem && part.part_number_oem.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.part_number_vendor && part.part_number_vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.description && part.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.category && part.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (part.invoice_number && part.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    processedParts.sort((a, b) => naturalSort(a.description, b.description));
    return processedParts;
  }, [parts, searchTerm, vehicleIdFilter, showUnassignedOnly, category, supplierFilter]);

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const currentParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage Parts & Orders</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('mainInventory')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'mainInventory' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}
            `}
          >
            Main Inventory
          </button>
          <button
            onClick={() => setActiveTab('partsToOrder')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'partsToOrder' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}
            `}
          >
            Part Ordering
          </button>
        </nav>
      </div>

      {activeTab === 'mainInventory' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Main Parts Inventory</h2>
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
              >
                {showAddForm ? <FaMinus className="mr-2" /> : <FaPlus className="mr-2" />}
                {showAddForm ? 'Cancel' : 'Add New Part'}
              </button>
              {selectedMainPartIds.size > 0 && (
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
                >
                  <FaPlus className="mr-2" /> Create Task from Selected ({selectedMainPartIds.size})
                </button>
              )}
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
            <select
              className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="">All Suppliers</option>
              {suppliers.sort((a, b) => naturalSort(a.name, b.name)).map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <div className="flex items-center ml-4">
              <input
                type="checkbox"
                id="showUnassignedManagePartsOnly"
                checked={showUnassignedOnly}
                onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                className="mr-2 h-4 w-4 bg-white rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:checked:bg-blue-500 dark:checked:border-transparent"
              />
              <label htmlFor="showUnassignedManagePartsOnly" className="text-sm text-gray-700 dark:text-gray-300">
                Show unassigned only
              </label>
            </div>
          </div>
          {vehicleIdFilter && activeTab === 'mainInventory' && (
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Showing parts assigned to vehicle: <strong>{vehicleNameFilter}</strong>. 
                <Link to="/parts" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setVehicleNameFilter('')}>
                  Clear filter
                </Link>
              </p>
            </div>
          )}
          {/* List of existing parts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 p-4 text-gray-800 dark:text-white">Existing Parts</h2>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input 
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={filteredParts && filteredParts.length > 0 && selectedMainPartIds.size === filteredParts.length}
                      onChange={handleSelectAllMainParts}
                      disabled={!filteredParts || filteredParts.length === 0}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">OEM Part No.</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Vendor Part No.</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Level</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentParts.map(part => (
                  <React.Fragment key={part.id}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${expandedPart === part.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                      <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <input 
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          checked={selectedMainPartIds.has(part.id)}
                          onChange={() => handleSelectMainPart(part.id)}
                        />
                      </td>
                      <td 
                        className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {part.part_number_oem}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white hidden md:table-cell">
                        {part.part_number_vendor}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {part.description}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {part.category}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {part.stock_level}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {vehicles.find(v => v.id === part.vehicle_id)?.license_plate || 'N/A'}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
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
                        <td colSpan="8" className="bg-white dark:bg-gray-800">
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
        </>
      )}

      {activeTab === 'partsToOrder' && (
        <PartsToOrderTabContent />
      )}

      {showCreateTaskModal && (
        <CreateTaskFromPartsModal
          isOpen={showCreateTaskModal}
          onClose={() => {
            setShowCreateTaskModal(false);
            // Optionally clear selection: setSelectedMainPartIds(new Set()); 
          }}
          selectedPartIds={selectedMainPartIds} // Pass the main inventory selection
          partsData={parts} // Pass the main inventory parts data
        />
      )}
    </div>
  );
};

export default ManageParts;