import React, { useState } from 'react';
import {
  addNewDocument,
  getAllDocumentsFromCollection,
  partsStructure,
  toolsStructure,
  suppliersStructure,
  locationStructure
} from '../firebaseOperations';

const AdminUpload = () => {
  const [file, setFile] = useState(null);
  const [tableType, setTableType] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTableTypeChange = (e) => {
    setTableType(e.target.value);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const obj = {};
      const currentLine = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j].trim();
      }
      result.push(obj);
    }
    return result;
  };

  const validateCSVData = async (parsedData, schema) => {
    const existingData = await getAllDocumentsFromCollection(tableType);
    const errors = [];

    parsedData.forEach((row, index) => {
      Object.keys(schema).forEach(key => {
        if (key !== 'id' && !row.hasOwnProperty(key)) {
          errors.push(`Row ${index + 1}: Missing required field "${key}"`);
        } else if (key !== 'id' && typeof row[key] !== typeof schema[key]) {
          errors.push(`Row ${index + 1}: Invalid type for field "${key}". Expected ${typeof schema[key]}, got ${typeof row[key]}`);
        }
      });

      // Check for duplicate entries
      const isDuplicate = existingData.some(existingItem => 
        (existingItem.name && existingItem.name === row.name) ||
        (existingItem.part_number_oem && existingItem.part_number_oem === row.part_number_oem)
      );

      if (isDuplicate) {
        errors.push(`Row ${index + 1}: Duplicate entry detected`);
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (!file || !tableType) {
      setUploadStatus('Please select a file and table type');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target.result;
      const parsedData = parseCSV(csv);

      // Get the schema for the selected table type
      const schema = getSchemaForTableType(tableType);

      // Validate the CSV data against the schema
      const validationErrors = await validateCSVData(parsedData, schema);

      if (validationErrors.length > 0) {
        setUploadStatus(`Validation errors:\n${validationErrors.join('\n')}`);
        return;
      }

      try {
        for (const item of parsedData) {
          await addNewDocument(tableType, item);
        }
        setUploadStatus(`Successfully uploaded ${parsedData.length} items to ${tableType}`);
      } catch (error) {
        setUploadStatus(`Error uploading data: ${error.message}`);
      }
    };

    reader.readAsText(file);
  };

  const getSchemaForTableType = (type) => {
    switch (type) {
      case 'parts':
        return partsStructure;
      case 'tools':
        return toolsStructure;
      case 'suppliers':
        return suppliersStructure;
      case 'locations':
        return locationStructure;
      default:
        return {};
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin CSV Upload</h1>
      <div className="mb-4">
        <label className="block mb-2">Select Table Type:</label>
        <select
          value={tableType}
          onChange={handleTableTypeChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a table</option>
          <option value="parts">Parts</option>
          <option value="tools">Tools</option>
          <option value="suppliers">Suppliers</option>
          <option value="locations">Locations</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Select CSV File:</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        onClick={handleUpload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload CSV
      </button>
      {uploadStatus && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{uploadStatus}</pre>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;