import fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './firebaseConfig.js';
import { addDoc, collection } from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addNewTool(toolData) {
  try {
    const docRef = await addDoc(collection(db, 'tools'), toolData);
    console.log(`Tool added: Asset Tag: ${toolData.asset_tag}, Name: ${toolData.name}, ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding tool: ${toolData.name} (${toolData.asset_tag})`, error);
    throw error;
  }
}

async function uploadToolsFromCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: The file ${filePath} does not exist.`);
    process.exit(1);
  }

  const parser = fs.createReadStream(filePath).pipe(parse({
    columns: true,
    skip_empty_lines: true,
    trim: true
  }));

  let recordCount = 0;

  for await (const record of parser) {
    try {
      const toolData = {
        asset_tag: record.asset_tag,
        name: record.name,
        manufacturer: record.manufacturer,
        type: record.type,
        category: record.category,
        location_id: record.location || '', // Changed from 'location' to 'location_id'
        size: record.size || '',
        invoice_number: record.invoice_number || '',
        cost: parseFloat(record.cost) || 0,
        quantity: parseInt(record.quantity) || 1,
        last_maintenance_date: record.last_maintenance_date || null,
        next_maintenance_due: record.next_maintenance_date || null,
        condition: record.condition || '',
        notes: record.notes || ''
      };

      // Remove empty fields
      Object.keys(toolData).forEach(key => 
        (toolData[key] === '' || toolData[key] === null || toolData[key] === undefined) && delete toolData[key]
      );

      await addNewTool(toolData);
      recordCount++;
      if (recordCount % 100 === 0) {
        console.log(`Uploaded ${recordCount} records`);
      }
    } catch (error) {
      console.error(`Error adding tool: ${record.name}`, error);
    }
  }

  console.log(`CSV upload completed. Total records: ${recordCount}`);
}

// Construct the full path to the CSV file
const csvFilePath = path.join(__dirname, '..', 'tools.csv');
console.log(`Looking for CSV file at: ${csvFilePath}`);

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: The file ${csvFilePath} does not exist.`);
  console.log('Please make sure the tools.csv file is in the root directory of your project.');
  process.exit(1);
}

uploadToolsFromCSV(csvFilePath)
  .then(() => {
    console.log('Upload process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during upload:', error);
    process.exit(1);
  });