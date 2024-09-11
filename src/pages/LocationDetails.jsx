import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLocation, getAllParts, getAllTools, updatePart, updateTool } from '../firebaseOperations';
import { FaPlus, FaMinus, FaPrint } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

const LocationDetails = () => {
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

  useEffect(() => {
    fetchLocationDetails();
    fetchParts();
    fetchTools();
    fetchVehicles();
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
      setParts(partsInLocation);
      setAvailableParts(partsNotInLocation);
    } catch (error) {
      console.error("Error fetching parts:", error);
    }
  };

  const fetchTools = async () => {
    try {
      const allTools = await getAllTools();
      const toolsInLocation = allTools.filter(tool => tool.location_id === id);
      const toolsNotInLocation = allTools.filter(tool => tool.location_id !== id);
      setTools(toolsInLocation);
      setAvailableTools(toolsNotInLocation);
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

  const handleAddPart = async (part) => {
    try {
      await updatePart(part.id, { ...part, location_id: id });
      fetchParts();
    } catch (error) {
      console.error("Error adding part to location:", error);
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
    try {
      await updateTool(tool.id, { ...tool, location_id: id });
      fetchTools();
    } catch (error) {
      console.error("Error adding tool to location:", error);
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
  );

  const filteredAvailableTools = availableTools.filter(tool =>
    tool.name.toLowerCase().includes(availableToolsSearchTerm.toLowerCase()) ||
    tool.asset_tag.toLowerCase().includes(availableToolsSearchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = showPartsTable
    ? filteredAvailableParts.slice(indexOfFirstItem, indexOfLastItem)
    : filteredAvailableTools.slice(indexOfFirstItem, indexOfLastItem);

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
        {currentItems.length > 0 ? (
          <ul className="space-y-2">
            {currentItems.map(item => (
              <li key={item.id} className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-white">
                  {showPartsTable 
                    ? `${item.description} (${item.part_number_oem}) - Vehicle: ${vehicles.find(v => v.id === item.vehicle_id)?.license_plate || 'N/A'}`
                    : `${item.name} (${item.asset_tag}) - Manufacturer: ${item.manufacturer}`
                  }
                </span>
                <button
                  onClick={() => showPartsTable ? handleAddPart(item) : handleAddTool(item)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded"
                >
                  <FaPlus />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No available {showPartsTable ? 'parts' : 'tools'} to add.</p>
        )}
        <div className="mt-4 flex justify-center">
          {Array.from({ length: Math.ceil((showPartsTable ? filteredAvailableParts.length : filteredAvailableTools.length) / itemsPerPage) }, (_, i) => (
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
    </div>
  );
};

export default LocationDetails;