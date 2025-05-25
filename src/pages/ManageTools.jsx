import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllTools, getAllLocations, addNewTool, updateTool, deleteTool, getToolsByCategory } from '../firebaseOperations';
import { FaPlus, FaMinus, FaEdit, FaSearch, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { naturalSort } from '../utils/naturalSort';
import { useNotification } from '../contexts/NotificationContext';

const ManageTools = () => {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const [newTool, setNewTool] = useState({
    name: '',
    asset_tag: '',
    manufacturer: '',
    type: '',
    category: '',
    location_id: '',
    size: '',
    invoice_number: '',
    last_maintenance_date: '',
    next_maintenance_due: '',
    condition: '',
    notes: ''
  });

  const [editingTool, setEditingTool] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 10;
  const [expandedToolId, setExpandedToolId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [formToolCategoryOptions, setFormToolCategoryOptions] = useState([]);
  
  const [selectedToolIds, setSelectedToolIds] = useState(new Set());

  const toolFormFields = [
    { name: 'asset_tag', label: 'Asset Tag', type: 'text', disabled: true },
    { name: 'name', label: 'Name/Description', type: 'text' },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
    { name: 'type', label: 'Type', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
    { name: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { name: 'last_maintenance_date', label: 'Last Maintenance Date', type: 'date' },
    { name: 'next_maintenance_due', label: 'Next Maintenance Due', type: 'date' },
    { name: 'condition', label: 'Condition', type: 'text' },
    { name: 'notes', label: 'Notes (Multiline)', type: 'textarea' },
  ];

  const { data: toolsData, isLoading: isLoadingTools, error: toolsError } = useQuery(
    ['tools', 'all'],
    getAllTools,
    {
      staleTime: 300000,
      cacheTime: 3600000,
      onSuccess: (data) => {
        if (data) {
          const uniqueCategories = ['all', ...new Set(data.map(t => t.category).filter(Boolean))];
          setCategories(uniqueCategories.sort(naturalSort));
          setFormToolCategoryOptions([...new Set(data.map(t => t.category).filter(Boolean))].sort(naturalSort));
        }
      }
    }
  );

  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useQuery(
    'locations',
    getAllLocations,
    {
      staleTime: 300000,
      cacheTime: 3600000,
    }
  );
  
  const locations = useMemo(() => locationsData || [], [locationsData]);

  const addToolMutation = useMutation(addNewTool, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tools', 'all']);
      showNotification("Tool added successfully!", "success");
      setShowAddForm(false);
      setNewTool({ 
        name: '', asset_tag: '', manufacturer: '', type: '', category: '', 
        location_id: '', size: '', invoice_number: '', last_maintenance_date: '',
        next_maintenance_due: '', condition: '', notes: ''
      });
    },
    onError: (error) => {
      showNotification(`Failed to add tool: ${error.message}`, "error");
    }
  });

  const updateToolMutation = useMutation(
    (variables) => updateTool(variables.id, variables.payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tools', 'all']);
        showNotification("Tool updated successfully!", "success");
        setEditingTool(null);
        setExpandedToolId(null);
      },
      onError: (error) => {
        showNotification(`Failed to update tool: ${error.message}`, "error");
      }
    }
  );

  const deleteToolMutation = useMutation(deleteTool, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tools', 'all']);
      showNotification("Tool deleted successfully!", "success");
    },
    onError: (error) => {
      showNotification(`Failed to delete tool: ${error.message}`, "error");
    }
  });
  
  const generateAssetTag = async () => {
    const currentTools = queryClient.getQueryData(['tools', 'all']) || await getAllTools();
    const existingAssetTags = currentTools.map(tool => tool.asset_tag ? parseInt(tool.asset_tag.replace(/[^0-9]/g, ''), 10) : 0).filter(tag => !isNaN(tag));
    const maxAssetTag = existingAssetTags.length > 0 ? Math.max(...existingAssetTags) : 0;
    return `AST-${(maxAssetTag + 1).toString().padStart(6, '0')}`;
  };

  const handleInputChange = (e, state, setState) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleAddTool = async () => {
    if (!newTool.name) {
      showNotification("Tool name/description is required.", "error");
      return;
    }
    let toolToAdd = { ...newTool };
    if (!newTool.asset_tag) {
      const generatedTag = await generateAssetTag();
      toolToAdd.asset_tag = generatedTag;
    }
    addToolMutation.mutate(toolToAdd);
  };

  const handleEditTool = async () => {
    if (!editingTool || !editingTool.name) {
      showNotification("Tool name/description is required.", "error");
      return;
    }
    updateToolMutation.mutate({ id: editingTool.id, payload: editingTool });
  };

  const handleDeleteTool = async (id) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      deleteToolMutation.mutate(id);
    }
  };
  
  const handleEditClick = (toolId) => {
    const toolToEdit = toolsData.find(tool => tool.id === toolId);
    setEditingTool(toolToEdit);
    setExpandedToolId(toolId);
  };

  const handleToggleExpandTool = (toolId) => {
    setExpandedToolId(prevId => (prevId === toolId ? null : toolId));
    if (expandedToolId === toolId) setEditingTool(null);
  };

  const handleSelectTool = (toolId) => {
    setSelectedToolIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(toolId)) {
        newSelectedIds.delete(toolId);
      } else {
        newSelectedIds.add(toolId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAllTools = () => {
    if (selectedToolIds.size === paginatedTools.length) {
      setSelectedToolIds(new Set());
    } else {
      setSelectedToolIds(new Set(paginatedTools.map(t => t.id)));
    }
  };

  const filteredTools = useMemo(() => {
    if (!toolsData) return [];
    let tempTools = [...toolsData];

    if (categoryFilter && categoryFilter !== 'all') {
      tempTools = tempTools.filter(tool => tool.category === categoryFilter);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempTools = tempTools.filter(tool =>
        tool.name?.toLowerCase().includes(lowerSearchTerm) ||
        tool.asset_tag?.toLowerCase().includes(lowerSearchTerm) ||
        tool.manufacturer?.toLowerCase().includes(lowerSearchTerm) ||
        tool.type?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    tempTools.sort((a, b) => naturalSort(a.name, b.name));
    return tempTools;
  }, [toolsData, searchTerm, categoryFilter]);

  const paginatedTools = useMemo(() => {
    if (!filteredTools || filteredTools.length === 0) return [];
    const startIndex = (currentPage - 1) * toolsPerPage;
    return filteredTools.slice(startIndex, startIndex + toolsPerPage);
  }, [filteredTools, currentPage, toolsPerPage]);

  const totalPages = Math.ceil(filteredTools.length / toolsPerPage);

  const getLocationName = (locationId) => {
    if (isLoadingLocations || !locations) return 'Loading...';
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'N/A';
  };

  const renderToolForm = (tool, setTool, submitHandler, buttonText) => (
    <form onSubmit={(e) => { e.preventDefault(); submitHandler(); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toolFormFields.map((field) => (
          <div key={field.name} className={`flex flex-col ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
            <label htmlFor={`${field.name}-${tool?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`${field.name}-${tool?.id || 'new'}`}
                name={field.name}
                value={tool[field.name] || ''}
                rows={3}
                onChange={(e) => handleInputChange(e, tool, setTool)}
                className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <input
                type={field.type}
                id={`${field.name}-${tool?.id || 'new'}`}
                name={field.name}
                value={tool[field.name] || (field.type === 'number' ? 0 : '')}
                onChange={(e) => handleInputChange(e, tool, setTool)}
                disabled={field.disabled && !!tool?.id}
                className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        ))}
        <div className="flex flex-col">
          <label htmlFor={`category-${tool?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <input
            type="text"
            id={`category-${tool?.id || 'new'}`}
            name="category"
            list={`tool-category-datalist-${tool?.id || 'new'}`}
            value={tool?.category || ''}
            onChange={(e) => handleInputChange(e, tool, setTool)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Select or type new category"
          />
          <datalist id={`tool-category-datalist-${tool?.id || 'new'}`}>
            {formToolCategoryOptions.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label htmlFor={`location_id-${tool?.id || 'new'}`} className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <select
            id={`location_id-${tool?.id || 'new'}`}
            name="location_id"
            value={tool?.location_id || ''}
            onChange={(e) => handleInputChange(e, tool, setTool)}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-10"
          >
            <option value="">Select Location</option>
            {locations.sort((a, b) => naturalSort(a.name, b.name)).map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        {buttonText === "Save Changes" && (
             <button
                type="button"
                onClick={() => { setEditingTool(null); setExpandedToolId(tool.id); }}
                className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded shadow-md"
            >
                Cancel
            </button>
        )}
        <button 
          type="submit" 
          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={addToolMutation.isLoading || updateToolMutation.isLoading}
        >
          {buttonText}
        </button>
      </div>
    </form>
  );

  if (isLoadingTools || isLoadingLocations) return <div className="p-4">Loading tools and locations...</div>;
  if (toolsError) return <div className="p-4 text-red-500">Error loading tools: {toolsError.message}</div>;
  if (locationsError) return <div className="p-4 text-red-500">Error loading locations: {locationsError.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage Tools</h1>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Tools Inventory</h2>
        <button
          onClick={async () => {
            if (!showAddForm) {
              const generatedTag = await generateAssetTag();
              setNewTool(prev => ({...prev, asset_tag: generatedTag}));
            }
            setShowAddForm(!showAddForm);
            setEditingTool(null);
            setExpandedToolId(null);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
        >
          <FaPlus className="mr-2" />
          {showAddForm ? 'Cancel' : 'Add New Tool'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Tool</h2>
          {renderToolForm(newTool, setNewTool, handleAddTool, "Add Tool")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow items-end">
        <div className="relative flex-grow md:col-span-1">
          <input
            type="text"
            placeholder="Search by name, asset tag, type..."
            className="w-full p-2 pl-10 pr-4 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="categoryFilterTools" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Category</label>
          <select
            id="categoryFilterTools"
            name="categoryFilterTools"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white h-10"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setCurrentPage(1);
            }}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 h-10"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-3 w-4">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAllTools} 
                  checked={selectedToolIds.size > 0 && paginatedTools.length > 0 && selectedToolIds.size === paginatedTools.length}
                  disabled={paginatedTools.length === 0}
                  className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset Tag</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name/Description</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Manufacturer</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
              <th className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTools.map((tool) => {
              const isExpanded = expandedToolId === tool.id;
              const isSelected = selectedToolIds.has(tool.id);
              const locationName = getLocationName(tool.location_id);

              return (
                <React.Fragment key={tool.id}>
                  <tr 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${isExpanded ? 'bg-gray-100 dark:bg-gray-600' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900' : ''} cursor-pointer`}
                    onClick={() => handleToggleExpandTool(tool.id)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleSelectTool(tool.id)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                      />
                    </td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{tool.asset_tag || 'N/A'}</td>
                    <td className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleExpandTool(tool.id); }}
                          className="mr-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-700"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {tool.name}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{tool.manufacturer || 'N/A'}</td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{tool.type || 'N/A'}</td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{tool.category || 'N/A'}</td>
                    <td className="p-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{locationName}</td>
                    <td className="p-3 text-sm text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditClick(tool.id); }} 
                        className="text-yellow-500 hover:text-yellow-700 p-1 rounded hover:bg-yellow-100 dark:hover:bg-gray-700"
                        aria-label="Edit Tool"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }} 
                        className="text-red-500 hover:text-red-700 p-1 ml-2 rounded hover:bg-red-100 dark:hover:bg-gray-700"
                        aria-label="Delete Tool"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                      <td colSpan={8} className="p-4">
                        {editingTool && editingTool.id === tool.id ? (
                          <div className="bg-white dark:bg-slate-700 p-4 rounded shadow-md">
                             <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Edit Tool: {tool.name}</h3>
                            {renderToolForm(editingTool, setEditingTool, handleEditTool, "Save Changes")}
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm p-2 bg-white dark:bg-slate-700 rounded shadow-md">
                            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-2 border-b pb-2 border-gray-200 dark:border-gray-600">Tool Details: {tool.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Asset Tag:</strong> {tool.asset_tag || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Manufacturer:</strong> {tool.manufacturer || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Type:</strong> {tool.type || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Size:</strong> {tool.size || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Category:</strong> {tool.category || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Location:</strong> {locationName}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Invoice Number:</strong> {tool.invoice_number || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Last Maintenance:</strong> {tool.last_maintenance_date || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Next Maintenance:</strong> {tool.next_maintenance_due || 'N/A'}</p>
                              <p><strong className="font-medium text-gray-600 dark:text-gray-300">Condition:</strong> {tool.condition || 'N/A'}</p>
                              {tool.notes && <p className="md:col-span-2 lg:col-span-3"><strong className="font-medium text-gray-600 dark:text-gray-300">Notes:</strong> {tool.notes}</p>}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex space-x-3">
                              <button 
                                onClick={() => handleEditClick(tool.id)} 
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm text-sm font-medium flex items-center"
                              >
                                <FaEdit className="mr-2"/> Edit This Tool
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
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ManageTools;
