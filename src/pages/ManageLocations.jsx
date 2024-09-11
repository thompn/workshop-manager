import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewLocation, getAllLocations, updateLocation, deleteLocation } from '../firebaseOperations';
import { FaEdit, FaTrash, FaChevronUp, FaChevronDown, FaPlus, FaMinus } from 'react-icons/fa';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: '',
    description: '',
  });
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const locationsPerPage = 10;
  const [itemsInLocation, setItemsInLocation] = useState({});

  useEffect(() => {
    fetchLocations();
    fetchItemsInLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const locationsData = await getAllLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchItemsInLocations = async () => {
    try {
      const partsData = await getAllParts();
      const toolsData = await getAllTools();
      
      const itemsCount = {};

      partsData.forEach(part => {
        if (part.location_id) {
          if (!itemsCount[part.location_id]) {
            itemsCount[part.location_id] = {};
          }
          itemsCount[part.location_id][part.id] = {
            name: part.name,
            quantity: part.quantity,
            asset_tag: part.part_number_oem
          };
        }
      });

      toolsData.forEach(tool => {
        if (tool.location_id) {
          if (!itemsCount[tool.location_id]) {
            itemsCount[tool.location_id] = {};
          }
          itemsCount[tool.location_id][tool.id] = {
            name: tool.name,
            quantity: tool.quantity,
            asset_tag: tool.asset_tag
          };
        }
      });

      setItemsInLocation(itemsCount);
    } catch (error) {
      console.error("Error fetching items in locations:", error);
    }
  };

  const handleInputChange = (e, state, setState) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddLocation = async () => {
    try {
      await addNewLocation(newLocation);
      setNewLocation({
        name: '',
        type: '',
        description: '',
      });
      fetchLocations();
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };

  const handleEditLocation = async (id) => {
    const locationToEdit = locations.find(loc => loc.id === id);
    if (!locationToEdit) return;
    try {
      await updateLocation(id, locationToEdit);
      setEditingLocationId(null);
      fetchLocations();
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleDeleteLocation = async (id) => {
    try {
      await deleteLocation(id);
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };

  const generateQRCodeURL = (locationId) => {
    return `${window.location.origin}/locations/${locationId}`;
  };

  const renderLocationForm = (location, setLocation, submitHandler, buttonText) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={location.name}
          onChange={(e) => setLocation({ ...location, name: e.target.value })}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="type" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Type
        </label>
        <input
          type="text"
          id="type"
          name="type"
          value={location.type}
          onChange={(e) => setLocation({ ...location, type: e.target.value })}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col col-span-2">
        <label htmlFor="description" className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={location.description}
          onChange={(e) => setLocation({ ...location, description: e.target.value })}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          rows="3"
        ></textarea>
      </div>
    </div>
  );

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredLocations = locations.filter(location =>
    Object.values(location).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedAndFilteredLocations = filteredLocations.sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastLocation = currentPage * locationsPerPage;
  const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
  const currentLocations = sortedAndFilteredLocations.slice(indexOfFirstLocation, indexOfLastLocation);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage Locations</h1>
      
      {/* Add Location button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
      >
        {showAddForm ? <FaMinus className="mr-2" /> : <FaPlus className="mr-2" />}
        {showAddForm ? 'Hide Add Form' : 'Add New Location'}
      </button>

      {/* Add Location form */}
      {showAddForm && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Location</h2>
          {renderLocationForm(newLocation, setNewLocation, handleAddLocation, "Add Location")}
          <button
            onClick={handleAddLocation}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Location
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>

      {/* Locations table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 text-left text-gray-800 dark:text-white cursor-pointer" onClick={() => handleSort('name')}>
                Name {sortColumn === 'name' && (sortDirection === 'asc' ? <FaChevronUp className="inline" /> : <FaChevronDown className="inline" />)}
              </th>
              <th className="p-2 text-left text-gray-800 dark:text-white cursor-pointer" onClick={() => handleSort('type')}>
                Type {sortColumn === 'type' && (sortDirection === 'asc' ? <FaChevronUp className="inline" /> : <FaChevronDown className="inline" />)}
              </th>
              <th className="p-2 text-left text-gray-800 dark:text-white cursor-pointer" onClick={() => handleSort('description')}>
                Description {sortColumn === 'description' && (sortDirection === 'asc' ? <FaChevronUp className="inline" /> : <FaChevronDown className="inline" />)}
              </th>
              <th className="p-2 text-left text-gray-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentLocations.map(location => (
              <React.Fragment key={location.id}>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2 text-gray-800 dark:text-white">
                    <Link to={`/locations/${location.id}`} className="text-blue-500 hover:text-blue-700">
                      {location.name}
                    </Link>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {itemsInLocation[location.id] && Object.entries(itemsInLocation[location.id]).map(([itemId, item]) => (
                        <div key={itemId}>
                          {item.quantity}x {item.name} ({item.asset_tag})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 text-gray-800 dark:text-white">{location.type}</td>
                  <td className="p-2 text-gray-800 dark:text-white">{location.description}</td>
                  <td className="p-2">
                    <button
                      onClick={() => setEditingLocationId(editingLocationId === location.id ? null : location.id)}
                      className="text-yellow-500 hover:text-yellow-700 mr-2"
                    >
                      <FaEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="text-xl" />
                    </button>
                  </td>
                </tr>
                {editingLocationId === location.id && (
                  <tr className="bg-gray-100 dark:bg-gray-900 transition-all duration-300 ease-in-out">
                    <td colSpan="4" className="p-4">
                      {renderLocationForm(
                        location,
                        (updatedLocation) => {
                          const updatedLocations = locations.map(loc => 
                            loc.id === location.id ? { ...loc, ...updatedLocation } : loc
                          );
                          setLocations(updatedLocations);
                        },
                        () => handleEditLocation(location.id),
                        "Save Changes"
                      )}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleEditLocation(location.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingLocationId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
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

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        {Array.from({ length: Math.ceil(sortedAndFilteredLocations.length / locationsPerPage) }, (_, i) => (
          <button
            key={i}
            onClick={() => paginate(i + 1)}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ManageLocations;