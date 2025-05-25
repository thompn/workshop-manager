import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllParts, addNewPart, updatePart, deletePart, getAllVehicles, getAllLocations, uploadInvoiceToStorage, getPartsByCategory, getAllSuppliers } from '../firebaseOperations';
import { FaEdit, FaTrash, FaPlus, FaMinus, FaSearch, FaChevronDown, FaChevronUp, FaTasks } from 'react-icons/fa';
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
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [formCategoryOptions, setFormCategoryOptions] = useState([]);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [vehicleNameFilter, setVehicleNameFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [selectedVehicleIdForFilter, setSelectedVehicleIdForFilter] = useState('');
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // State for main inventory part selection and task modal
  const [selectedMainPartIds, setSelectedMainPartIds] = useState(new Set());
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Effect to handle tab switching from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Effect to initialize UI vehicle filter from URL and update vehicle name display
  useEffect(() => {
    if (vehicleIdFilter && vehicles.length > 0) {
      setSelectedVehicleIdForFilter(vehicleIdFilter);
      const specificVehicle = vehicles.find(v => v.id === vehicleIdFilter);
      if (specificVehicle) {
        setVehicleNameFilter(`${specificVehicle.make} ${specificVehicle.model} (${specificVehicle.license_plate || specificVehicle.vin})`);
      } else {
        setVehicleNameFilter(`ID: ${vehicleIdFilter}`);
      }
    } else if (!vehicleIdFilter) {
      // If URL filter is removed, clear UI filter and name
      setSelectedVehicleIdForFilter('');
      setVehicleNameFilter('');
    }
  }, [vehicleIdFilter, vehicles]);

  // Effect to update vehicleNameFilter when selectedVehicleIdForFilter changes via UI
  useEffect(() => {
    if (selectedVehicleIdForFilter && vehicles.length > 0) {
      const specificVehicle = vehicles.find(v => v.id === selectedVehicleIdForFilter);
      if (specificVehicle) {
        setVehicleNameFilter(`${specificVehicle.make} ${specificVehicle.model} (${specificVehicle.license_plate || specificVehicle.vin})`);
      } else {
        setVehicleNameFilter(`ID: ${selectedVehicleIdForFilter}`);
      }
    } else if (!selectedVehicleIdForFilter) {
      setVehicleNameFilter('');
    }
  }, [selectedVehicleIdForFilter, vehicles]);

  const { data: parts, isLoading, error } = useQuery(
    ['parts', 'all'],
    () => getAllParts(),
    {
      staleTime: 300000,
      cacheTime: 3600000,
      onSuccess: (allPartsData) => {
        if (allPartsData) {
          const uniqueCategories = ['all', ...new Set(allPartsData.map(p => p.category).filter(Boolean))];
          setCategories(uniqueCategories.sort(naturalSort));
          setFormCategoryOptions([...new Set(allPartsData.map(p => p.category).filter(Boolean))].sort(naturalSort));
        }
      }
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
  }, []);

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
      setExpandedPartId(null);
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
    <form onSubmit={(e) => { e.preventDefault(); submitHandler(); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: "part_number_oem", label: "OEM Part Number", type: "text" },
          { name: "part_number_vendor", label: "Vendor Part Number", type: "text" },
          { name: "description", label: "Description", type: "text" },
          { name: "cost", label: "Cost (in cents)", type: "number" },
          { name: "stock_level", label: "Stock Level", type: "number" },
          { name: "reorder_threshold", label: "Reorder Threshold", type: "number" },
          { name: "invoice_number", label: "Invoice Number", type: "text" },
        ].map((field) => (
          <div key={field.name} className="flex flex-col">
            <label htmlFor={`${field.name}-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            <input
              type={field.type}
              id={`${field.name}-${part?.id || 'new'}`}
              name={field.name}
              value={part[field.name] || (field.type === 'number' ? 0 : '')}
              onChange={(e) => handleInputChange(e, part, setPart)}
              className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        ))}
        <div className="flex flex-col">
          <label htmlFor={`category-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <input
            type="text"
            id={`category-${part?.id || 'new'}`}
            name="category"
            list={`category-datalist-${part?.id || 'new'}`}
            value={part.category || ''}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Select or type new category"
          />
          <datalist id={`category-datalist-${part?.id || 'new'}`}>
            {formCategoryOptions.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div className="flex items-center mt-2 md:mt-0 md:pt-6">
          <input
            type="checkbox"
            id={`consumable-${part?.id || 'new'}`}
            name="consumable"
            checked={!!part.consumable}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          />
          <label htmlFor={`consumable-${part?.id || 'new'}`} className="text-sm text-gray-800 dark:text-white">Consumable</label>
        </div>
        <div className="flex flex-col">
          <label htmlFor={`vehicle_id-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Associated Vehicle
          </label>
          <select
            id={`vehicle_id-${part?.id || 'new'}`}
            name="vehicle_id"
            value={part.vehicle_id || ''}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-10"
          >
            <option value="">Select Vehicle (Optional)</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.license_plate || vehicle.vin})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor={`supplier_id-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Supplier
          </label>
          <select
            id={`supplier_id-${part?.id || 'new'}`}
            name="supplier_id"
            value={part.supplier_id || ''}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-10"
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
          <label htmlFor={`location_id-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <select
            id={`location_id-${part?.id || 'new'}`}
            name="location_id"
            value={part.location_id || ''}
            onChange={(e) => handleInputChange(e, part, setPart)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-10"
          >
            <option value="">Select Location</option>
            {locations.sort((a, b) => naturalSort(a.name, b.name)).map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`invoice_upload-${part?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Invoice (PDF)
          </label>
          <input
            type="file"
            id={`invoice_upload-${part?.id || 'new'}`}
            accept=".pdf"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
          />
          {invoiceFile && editingPart && editingPart.id === part.id && (
            <button
              type="button"
              onClick={uploadInvoice}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Upload Selected Invoice
            </button>
          )}
          {uploadProgress > 0 && editingPart && editingPart.id === part.id && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button 
          type="submit" 
          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={updatePartMutation.isLoading || addPartMutation.isLoading}
        >
          {buttonText}
        </button>
      </div>
    </form>
  );

  const handleEditClick = (partId) => {
    const partToEdit = parts.find(part => part.id === partId);
    setEditingPart(partToEdit);
    setExpandedPartId(partId);
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
    if (selectedMainPartIds.size === paginatedParts.length) {
      setSelectedMainPartIds(new Set());
    } else {
      setSelectedMainPartIds(new Set(paginatedParts.map(p => p.id)));
    }
  };

  const filteredParts = useMemo(() => {
    if (!parts) return [];
    let tempParts = [...parts];

    const currentVehicleFilterId = selectedVehicleIdForFilter || vehicleIdFilter;
    if (currentVehicleFilterId) {
      tempParts = tempParts.filter(part => part.vehicle_id === currentVehicleFilterId);
    }

    if (showUnassignedOnly) {
      tempParts = tempParts.filter(part => !part.vehicle_id);
    }

    if (supplierFilter) {
      tempParts = tempParts.filter(part => part.supplier_id === supplierFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      tempParts = tempParts.filter(part => part.category === categoryFilter);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempParts = tempParts.filter(part =>
        part.description?.toLowerCase().includes(lowerSearchTerm) ||
        part.part_number_oem?.toLowerCase().includes(lowerSearchTerm) ||
        part.part_number_vendor?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    tempParts.sort((a, b) => naturalSort(a.description, b.description));
    return tempParts;
  }, [parts, searchTerm, selectedVehicleIdForFilter, vehicleIdFilter, showUnassignedOnly, supplierFilter, categoryFilter, naturalSort]);

  const handleToggleExpandPart = (partId) => {
    setExpandedPartId(prevId => (prevId === partId ? null : partId));
  };
  
  const paginatedParts = useMemo(() => {
    if (!filteredParts || filteredParts.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredParts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredParts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

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
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
              >
                <FaPlus className="mr-2" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow items-end">
            <div className="relative flex-grow md:col-span-1">
              <input
                type="text"
                placeholder="Search by name, OEM, vendor..."
                className="w-full p-2 pl-10 pr-4 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Category</label>
              <select
                id="categoryFilter"
                name="categoryFilter"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-10"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="vehicleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Vehicle</label>
              <select 
                id="vehicleFilter"
                value={selectedVehicleIdForFilter}
                onChange={(e) => setSelectedVehicleIdForFilter(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-10"
              >
                <option value="">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate || v.vin})</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="supplierFilterSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Supplier</label>
              <select 
                id="supplierFilterSelect" 
                value={supplierFilter} 
                onChange={(e) => setSupplierFilter(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-10"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setSelectedVehicleIdForFilter('');
                  setSupplierFilter('');
                  setCategoryFilter('all');
                  setSearchTerm('');
                  setShowUnassignedOnly(false);
                }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 h-10"
              >
                Clear Filters
              </button>
            </div>
          </div>
          {selectedVehicleIdForFilter && activeTab === 'mainInventory' && (
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Showing parts assigned to vehicle: <strong>{vehicleNameFilter}</strong>. 
                <button 
                  onClick={() => {
                    setSelectedVehicleIdForFilter('');
                  }}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Clear filter
                </button>
              </p>
            </div>
          )}
          {/* List of existing parts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4 p-4 text-gray-800 dark:text-white">Main Inventory</h2>
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="p-3 w-4">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllMainParts} 
                      checked={selectedMainPartIds.size > 0 && paginatedParts.length > 0 && selectedMainPartIds.size === paginatedParts.length}
                      disabled={paginatedParts.length === 0}
                      className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">OEM Part No.</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParts.map((part) => {
                  const isExpanded = expandedPartId === part.id;
                  const stockLevel = part.stock_level || 0;
                  const reorderThreshold = part.reorder_threshold || 0;
                  let stockClass = 'text-gray-700 dark:text-gray-300';
                  let stockIndicatorClass = 'bg-gray-400';

                  if (stockLevel <= 0) {
                    stockClass = 'text-red-600 dark:text-red-400 font-semibold';
                    stockIndicatorClass = 'bg-red-500';
                  } else if (stockLevel <= reorderThreshold) {
                    stockClass = 'text-yellow-600 dark:text-yellow-400 font-semibold';
                    stockIndicatorClass = 'bg-yellow-500';
                  } else {
                    stockIndicatorClass = 'bg-green-500';
                  }

                  const supplierName = suppliers.find(s => s.id === part.supplier_id)?.name || 'N/A';
                  const locationName = locations.find(l => l.id === part.location_id)?.name || 'N/A';
                  const isSelected = selectedMainPartIds.has(part.id);

                  return (
                    <React.Fragment key={part.id}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${isExpanded ? 'bg-gray-100 dark:bg-gray-600' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900' : ''} cursor-pointer`}
                        onClick={() => handleToggleExpandPart(part.id)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleSelectMainPart(part.id)} 
                            className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                          />
                        </td>
                        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex items-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleExpandPart(part.id); }}
                              className="mr-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-700"
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                            {part.description}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{part.part_number_oem}</td>
                        <td className={`p-3 text-sm text-right whitespace-nowrap ${stockClass}`}>
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${stockIndicatorClass}`} title={`Stock: ${stockLevel}, Reorder at: ${reorderThreshold}`}></span>
                          {stockLevel}
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(part.cost / 100)}
                        </td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{part.category || 'N/A'}</td>
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{locationName}</td>
                        <td className="p-3 text-sm text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditClick(part.id); }} 
                            className="text-yellow-500 hover:text-yellow-700 p-1 rounded hover:bg-yellow-100 dark:hover:bg-gray-700"
                            aria-label="Edit Part"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(window.confirm('Are you sure you want to delete this part?')) handleDeletePart(part.id); }} 
                            className="text-red-500 hover:text-red-700 p-1 ml-2 rounded hover:bg-red-100 dark:hover:bg-gray-700"
                            aria-label="Delete Part"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                          <td colSpan={activeTab === 'mainInventory' ? 8 : 7} className="p-4">
                            {editingPart && editingPart.id === part.id ? (
                              <div className="bg-white dark:bg-slate-700 p-4 rounded shadow-md">
                                {renderPartForm(editingPart, setEditingPart, handleEditPart, "Save Changes")}
                                <button
                                    onClick={() => setEditingPart(null)}
                                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancel Edit
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3 text-sm p-2 bg-white dark:bg-slate-700 rounded shadow-md">
                                <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2 border-b pb-2 border-gray-200 dark:border-gray-600">Detailed Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Description:</strong> {part.description}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">OEM Part No.:</strong> {part.part_number_oem}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Vendor Part No.:</strong> {part.part_number_vendor || 'N/A'}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Category:</strong> {part.category || 'N/A'}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Cost:</strong> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(part.cost / 100)}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Stock Level:</strong> <span className={stockClass}>{stockLevel}</span></p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Reorder Threshold:</strong> {part.reorder_threshold || 0}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Supplier:</strong> {supplierName}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Location:</strong> {locationName}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Consumable:</strong> {part.consumable ? 'Yes' : 'No'}</p>
                                  <p><strong className="font-medium text-gray-600 dark:text-gray-300">Invoice Number:</strong> {part.invoice_number || 'N/A'}</p>
                                  {part.vehicle_id && vehicles.find(v => v.id === part.vehicle_id) && (
                                    <p><strong className="font-medium text-gray-600 dark:text-gray-300">Assigned Vehicle:</strong> {vehicles.find(v => v.id === part.vehicle_id)?.make} {vehicles.find(v => v.id === part.vehicle_id)?.model || 'N/A'} ({vehicles.find(v => v.id === part.vehicle_id)?.license_plate || vehicles.find(v => v.id === part.vehicle_id)?.vin})</p>
                                  )}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex space-x-3">
                                  <button 
                                    onClick={() => handleEditClick(part.id)} 
                                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-sm font-medium flex items-center"
                                  >
                                    <FaEdit className="mr-2"/> Edit This Part
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
          }}
          selectedPartIds={selectedMainPartIds}
          partsData={parts}
        />
      )}
    </div>
  );
};

export default ManageParts;