import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLocation, getAllParts, getAllTools, updatePart, updateTool, getAllVehicles, getAllLocations, addNewPart, addNewTool } from '../firebaseOperations';
import { FaPlus, FaMinus, FaPrint } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { naturalSort } from '../utils/naturalSort';
import { useNotification } from '../contexts/NotificationContext';

const LocationDetails = () => {
  const { showNotification } = useNotification();
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [parts, setParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [availablePartsSearchTerm, setAvailablePartsSearchTerm] = useState('');
  const [tools, setTools] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [availableToolsSearchTerm, setAvailableToolsSearchTerm] = useState('');
  const [showPartsTable, setShowPartsTable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [vehicles, setVehicles] = useState([]);
  const [allLocationsData, setAllLocationsData] = useState([]);
  const [locationsMap, setLocationsMap] = useState({});
  const [showTrulyUnassignedAvailable, setShowTrulyUnassignedAvailable] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [itemForQuantityModal, setItemForQuantityModal] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  useEffect(() => {
    fetchLocationDetails();
    fetchParts();
    fetchTools();
    fetchVehicles();
    fetchAllLocationsData();
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      const locationData = await getLocation(id);
      setLocation(locationData);
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const fetchParts = async () => {
    try {
      const allParts = await getAllParts();
      const partsInLocation = allParts.filter(part => part.location_id === id);
      const partsNotInLocation = allParts.filter(part => part.location_id !== id);
      
      // Sort available parts naturally by description
      const sortedAvailableParts = partsNotInLocation.sort((a, b) => naturalSort(a.description, b.description));
      
      setParts(partsInLocation);
      setAvailableParts(sortedAvailableParts);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchTools = async () => {
    try {
      const allTools = await getAllTools();
      const toolsInLocation = allTools.filter(tool => tool.location_id === id);
      const toolsNotInLocation = allTools.filter(tool => tool.location_id !== id);

      // Sort available tools naturally by name
      const sortedAvailableTools = toolsNotInLocation.sort((a, b) => naturalSort(a.name, b.name));

      setTools(toolsInLocation);
      setAvailableTools(sortedAvailableTools);
    } catch (error) {
      console.error("Error fetching tools:", error);
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

  const fetchAllLocationsData = async () => {
    try {
      const locData = await getAllLocations();
      setAllLocationsData(locData);
      const map = locData.reduce((acc, loc) => {
        acc[loc.id] = loc;
        return acc;
      }, {});
      setLocationsMap(map);
    } catch (error) {
      console.error("Error fetching all locations data:", error);
    }
  };

  const handleAddPart = async (part) => {
    // Open modal to specify quantity
    setItemForQuantityModal(part);
    setQuantityToAdd(part.stock_level > 0 ? 1 : 0); // Default to 1 or 0 if no stock
    setShowQuantityModal(true);
    // Actual logic will be in handleConfirmAddPartWithQuantity
  };

  const handleConfirmAddPartWithQuantity = async () => {
    if (!itemForQuantityModal || !location) return;

    const part = itemForQuantityModal;
    const requestedQuantity = Number(quantityToAdd);

    if (requestedQuantity <= 0 || requestedQuantity > part.stock_level) {
      showNotification(`Please enter a quantity between 1 and ${part.stock_level}.`, "error");
      return;
    }

    try {
      if (requestedQuantity === part.stock_level) {
        // Move the entire existing part record
        await updatePart(part.id, { ...part, location_id: id });
      } else {
        // Split: Create a new part record for this location, update original part's stock
        const newPartPayload = {
          ...part, // Copy all details from original part
          id: undefined, // Firestore will generate a new ID
          stock_level: requestedQuantity,
          location_id: id,
        };
        delete newPartPayload.id; // Ensure ID is not passed for new document

        await addNewPart(newPartPayload);
        await updatePart(part.id, { ...part, stock_level: part.stock_level - requestedQuantity });
      }
      setShowQuantityModal(false);
      setItemForQuantityModal(null);
      fetchParts(); // Re-fetch parts to update both lists
      showNotification('Part quantity updated for location successfully!', "success");
    } catch (error) {
      console.error("Error processing part quantity for location:", error);
      showNotification(`Failed to process part quantity: ${error.message}`, "error");
    }
  };

  const handleRemovePart = async (part) => {
    try {
      await updatePart(part.id, { ...part, location_id: '' });
      fetchParts();
    } catch (error) {
      console.error("Error removing part from location:", error);
    }
  };

  const handleAddTool = async (tool) => {
    // Open modal to specify quantity
    setItemForQuantityModal(tool);
    setQuantityToAdd(tool.quantity > 0 ? 1 : 0); // Default to 1 or 0 if no stock
    setShowQuantityModal(true);
    // Actual logic will be in handleConfirmAddToolWithQuantity
  };

  const handleConfirmAddToolWithQuantity = async () => {
    if (!itemForQuantityModal || !location) return;

    const tool = itemForQuantityModal;
    const requestedQuantity = Number(quantityToAdd);

    if (requestedQuantity <= 0 || requestedQuantity > tool.quantity) {
      showNotification(`Please enter a quantity between 1 and ${tool.quantity}.`, "error");
      return;
    }

    try {
      if (requestedQuantity === tool.quantity) {
        // Move the entire existing tool record
        await updateTool(tool.id, { ...tool, location_id: id });
      } else {
        // Split: Create a new tool record for this location, update original tool's quantity
        const newToolPayload = {
          ...tool, // Copy all details from original tool
          id: undefined, // Firestore will generate a new ID
          quantity: requestedQuantity,
          location_id: id,
        };
        delete newToolPayload.id; // Ensure ID is not passed for new document

        await addNewTool(newToolPayload);
        await updateTool(tool.id, { ...tool, quantity: tool.quantity - requestedQuantity });
      }
      setShowQuantityModal(false);
      setItemForQuantityModal(null);
      fetchTools(); // Re-fetch tools to update both lists
      showNotification('Tool quantity updated for location successfully!', "success");
    } catch (error) {
      console.error("Error processing tool quantity for location:", error);
      showNotification(`Failed to process tool quantity: ${error.message}`, "error");
    }
  };

  const handleRemoveTool = async (tool) => {
    try {
      await updateTool(tool.id, { ...tool, location_id: '' });
      fetchTools();
    } catch (error) {
      console.error("Error removing tool from location:", error);
    }
  };

  const generateQRCodeURL = () => {
    return window.location.href;
  };

  const printQRCode = () => {
    const qrCodeURL = generateQRCodeURL();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code for ${location.name}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          </style>
        </head>
        <body>
          <div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeURL)}" alt="QR Code" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const filteredAvailableParts = availableParts.filter(part =>
    part.description.toLowerCase().includes(availablePartsSearchTerm.toLowerCase()) ||
    part.part_number_oem.toLowerCase().includes(availablePartsSearchTerm.toLowerCase())
  ).filter(part => {
    return !showTrulyUnassignedAvailable || !part.location_id;
  });

  const filteredAvailableTools = availableTools.filter(tool =>
    tool.name.toLowerCase().includes(availableToolsSearchTerm.toLowerCase()) ||
    tool.asset_tag.toLowerCase().includes(availableToolsSearchTerm.toLowerCase())
  ).filter(tool => {
    return !showTrulyUnassignedAvailable || !tool.location_id;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = showPartsTable
    ? filteredAvailableParts.slice(indexOfFirstItem, indexOfLastItem)
    : filteredAvailableTools.slice(indexOfFirstItem, indexOfLastItem);

  const totalPagesForAvailableItems = Math.ceil(
    (showPartsTable ? filteredAvailableParts.length : filteredAvailableTools.length) / itemsPerPage
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!location) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{location.name} Details</h1>
        <Link to="/locations/manage" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          Back to Locations
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Location Information</h2>
          <p><strong>Type:</strong> {location.type}</p>
          <p><strong>Description:</strong> {location.description}</p>
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">QR Code</h3>
            <div className="flex flex-col items-center">
              <QRCodeSVG value={generateQRCodeURL()} size={200} />
              <button
                onClick={printQRCode}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <FaPrint className="mr-2" /> Print QR Code
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Items in this Location</h2>
          <div className="max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Parts</h3>
            {parts.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {parts.map(part => (
                  <li key={part.id} className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-white">{part.description} ({part.part_number_oem})</span>
                    <button
                      onClick={() => handleRemovePart(part)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                    >
                      <FaMinus />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mb-4">No parts in this location.</p>
            )}
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Tools</h3>
            {tools.length > 0 ? (
              <ul className="space-y-2">
                {tools.map(tool => (
                  <li key={tool.id} className="flex justify-between items-center">
                    <span className="text-gray-800 dark:text-white">
                      {tool.manufacturer} - {tool.name} ({tool.asset_tag})
                    </span>
                    <button
                      onClick={() => handleRemoveTool(tool)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                    >
                      <FaMinus />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No tools in this location.</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Available Items</h2>
          <div>
            <button
              onClick={() => setShowPartsTable(true)}
              className={`mr-2 ${showPartsTable ? 'bg-blue-500' : 'bg-gray-300'} text-white font-bold py-2 px-4 rounded`}
            >
              Parts
            </button>
            <button
              onClick={() => setShowPartsTable(false)}
              className={`${!showPartsTable ? 'bg-blue-500' : 'bg-gray-300'} text-white font-bold py-2 px-4 rounded`}
            >
              Tools
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder={`Search available ${showPartsTable ? 'parts' : 'tools'}...`}
          className="w-full p-2 mb-4 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          value={showPartsTable ? availablePartsSearchTerm : availableToolsSearchTerm}
          onChange={(e) => showPartsTable ? setAvailablePartsSearchTerm(e.target.value) : setAvailableToolsSearchTerm(e.target.value)}
        />
        <div className="my-2 flex items-center">
          <input
            type="checkbox"
            id="showTrulyUnassignedAvailable"
            checked={showTrulyUnassignedAvailable}
            onChange={(e) => setShowTrulyUnassignedAvailable(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showTrulyUnassignedAvailable" className="text-sm text-gray-700 dark:text-gray-300">
            Show only items not assigned to any location
          </label>
        </div>
        {/* Quantity Modal */}
        {showQuantityModal && itemForQuantityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Add {showPartsTable ? 'Part' : 'Tool'} to {location?.name}
              </h3>
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                Item: {showPartsTable ? `${itemForQuantityModal.description} (${itemForQuantityModal.part_number_oem})` : `${itemForQuantityModal.name} (${itemForQuantityModal.asset_tag})`}
              </p>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                Total available stock/quantity: {showPartsTable ? itemForQuantityModal.stock_level : itemForQuantityModal.quantity}
              </p>
              <label htmlFor="quantityToAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity to add to this location:
              </label>
              <input
                type="number"
                id="quantityToAdd"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                min="1"
                max={showPartsTable ? itemForQuantityModal.stock_level : itemForQuantityModal.quantity}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-6"
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowQuantityModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={showPartsTable ? handleConfirmAddPartWithQuantity : handleConfirmAddToolWithQuantity}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Confirm Add Quantity
                </button>
              </div>
            </div>
          </div>
        )}
        {currentItems.length > 0 ? (
          <ul className="space-y-1">
            {currentItems.map(item => (
              <li key={item.id} className="flex justify-between items-center p-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                {showPartsTable ? (
                  <div className="flex-grow mr-4">
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {item.description} 
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({item.part_number_oem})</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Vehicle: {vehicles.find(v => v.id === item.vehicle_id)?.license_plate || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Current Location: {item.location_id ? (locationsMap[item.location_id]?.name || 'Unknown') : 'Unassigned'}
                    </p>
                  </div>
                ) : (
                  <div className="flex-grow mr-4">
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {item.name} 
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({item.asset_tag})</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Manufacturer: {item.manufacturer}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => showPartsTable ? handleAddPart(item) : handleAddTool(item)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm flex-shrink-0"
                >
                  <FaPlus className="mr-1 inline" /> Add
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No available {showPartsTable ? 'parts' : 'tools'} to add.</p>
        )}
        <div className="mt-6 flex justify-between items-center">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPagesForAvailableItems > 0 ? totalPagesForAvailableItems : 1}</span>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesForAvailableItems))}
            disabled={currentPage === totalPagesForAvailableItems || totalPagesForAvailableItems === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationDetails;