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

  useEffect(() => {
    fetchLocationDetails();
    fetchParts();
    fetchTools();
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
      setTools(toolsInLocation);
    } catch (error) {
      console.error("Error fetching tools:", error);
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No tools in this location.</p>
          )}
        </div>
      </div>
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Available Parts</h2>
        <input
          type="text"
          placeholder="Search available parts..."
          className="w-full p-2 mb-4 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          value={availablePartsSearchTerm}
          onChange={(e) => setAvailablePartsSearchTerm(e.target.value)}
        />
        {filteredAvailableParts.length > 0 ? (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAvailableParts.map(part => (
              <li key={part.id} className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-white">{part.description} ({part.part_number_oem})</span>
                <button
                  onClick={() => handleAddPart(part)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded"
                >
                  <FaPlus />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No available parts to add.</p>
        )}
      </div>
    </div>
  );
};

export default LocationDetails;