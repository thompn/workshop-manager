import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { addNewLocation, getAllLocations, updateLocation, deleteLocation } from '../firebaseOperations';
import { FaEdit, FaTrash, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

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

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const locationsData = await getAllLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Locations</h1>
        <Link to="/parts/manage" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Manage Parts
        </Link>
      </div>

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

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 p-4 text-gray-800 dark:text-white">Existing Locations</h2>
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
            {sortedAndFilteredLocations.map(location => (
              <React.Fragment key={location.id}>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2 text-gray-800 dark:text-white">
                    <Link to={`/locations/${location.id}`} className="text-blue-500 hover:text-blue-700">
                      {location.name}
                    </Link>
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
    </div>
  );
};

export default ManageLocations;