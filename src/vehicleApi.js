export const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export const getAllVehicleMakesFromNHTSA = async () => {
  try {
    const response = await fetch(`${NHTSA_BASE_URL}/GetAllMakes?format=json`);
    if (!response.ok) {
      throw new Error(`NHTSA API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.Results) {
      return data.Results.map(make => ({
        id: make.Make_ID,
        name: make.Make_Name.trim()
      })).sort((a, b) => a.name.localeCompare(b.name)); // Sort makes alphabetically
    }
    return [];
  } catch (error) {
    console.error("Error fetching vehicle makes from NHTSA:", error);
    // It's often better to let the caller handle UI notifications
    // For example, react-query's error state can be used
    throw error; 
  }
};

export const getModelsForMakeIdFromNHTSA = async (makeId) => {
  if (!makeId) return []; // Or throw an error if makeId is expected
  try {
    const response = await fetch(`${NHTSA_BASE_URL}/GetModelsForMakeId/${makeId}?format=json`);
    if (!response.ok) {
      throw new Error(`NHTSA API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.Results) {
      // Filter out models with generic names like "Other" or "All Other Models" if desired
      // Also, some model names might be duplicative if they represent different vehicle types but share a name.
      // For now, we'll take them as is and sort.
      const uniqueModels = data.Results.map(model => ({
        id: model.Model_ID,
        name: model.Model_Name.trim(),
        makeId: model.Make_ID
      }));
      
      // Create a Set of names to filter out duplicates for the dropdown
      const modelNames = new Set();
      const filteredModels = uniqueModels.filter(model => {
        if (modelNames.has(model.name)) {
          return false;
        }
        modelNames.add(model.name);
        return true;
      });

      return filteredModels.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching models for makeId ${makeId} from NHTSA:`, error);
    throw error;
  }
};

// For fetching models by Make ID and Year
export const getModelsForMakeIdYearFromNHTSA = async (makeId, year) => {
  if (!makeId || !year) return [];
  try {
    // Note: The API endpoint uses /make/MakeName/modelyear/YYYY
    // We need to get MakeName from MakeId first, or use an endpoint that takes MakeId directly if available.
    // The endpoint GetModelsForMakeIdYear/makeId/{MakeId}/modelyear/{year} is what we need
    const response = await fetch(`${NHTSA_BASE_URL}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`);
    if (!response.ok) {
      throw new Error(`NHTSA API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.Results) {
      const modelNames = new Set();
      const filteredModels = data.Results.map(model => ({
        id: model.Model_ID,
        name: model.Model_Name.trim(),
        makeId: model.Make_ID,
        modelYear: year // Add the year for context
      })).filter(model => {
        if (modelNames.has(model.name)) {
          return false;
        }
        modelNames.add(model.name);
        return true;
      });
      return filteredModels.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching models for makeId ${makeId} and year ${year} from NHTSA:`, error);
    throw error;
  }
};

// For fetching vehicle details by VIN
// Using DecodeVinValues for a simpler key-value pair response initially
export const getVehicleDetailsByVin = async (vin, year = null) => {
  if (!vin || vin.length < 11) { 
    // Consider returning a structured error or throwing, consistent with API failures
    // For now, let the API call proceed and handle its response.
  }
  let url = `${NHTSA_BASE_URL}/DecodeVinValues/${vin}?format=json`;
  if (year) {
    url += `&modelyear=${year}`;
  }

  try {
    const response = await fetch(url);
    // No need to check response.ok here if we always parse and return the body,
    // as NHTSA often returns 200 OK even for errors, with details in the JSON body.
    const data = await response.json(); 

    const responseDetails = {};

    // Preserve top-level API response fields that are useful for diagnostics or context.
    if (data.Message) responseDetails.Message = data.Message;
    responseDetails.ErrorCode = data.ErrorCode || ""; // Ensure ErrorCode is always present, even if empty string
    if (data.ErrorText) responseDetails.ErrorText = data.ErrorText;
    if (data.SearchCriteria) responseDetails.SearchCriteria = data.SearchCriteria;
    
    // Include the raw Results array. Ensure it's an array, defaulting to empty if not present.
    responseDetails.Results = Array.isArray(data.Results) ? data.Results : [];

    // Populate with key-value pairs from Results items if Results is a non-empty array
    if (responseDetails.Results.length > 0) {
      responseDetails.Results.forEach(item => {
        if (item.Variable) { 
          // Add both the original variable name (with spaces) and a version without spaces for easier access.
          // The version without spaces might be more convenient as a JS object key.
          // However, components are currently using original names; stick to that for direct mapping for now.
          responseDetails[item.Variable] = item.Value; 
        }
      });
    }
    
    // If the primary way to check for actual data is the content of `responseDetails` 
    // beyond ErrorCode, Message, etc., this structure is fine.
    // The components already check `details.ErrorCode` and the presence of other keys.
    return responseDetails;

  } catch (error) {
    console.error(`Error decoding VIN ${vin} from NHTSA (network or JSON parse error):`, error);
    // For network errors or critical issues, throw or return a structured error
    // that calling functions can distinguish from API-reported errors (like invalid VIN).
    return {
        ErrorCode: "FETCH_ERROR", // Custom error code for client-side fetch issues
        ErrorText: `Client-side error: ${error.message}`,
        Results: []
    };
  }
};

// Consider adding a function for DecodeVinExtended as well for more detailed specs later.
// export const getExtendedVehicleDetailsByVin = async (vin, year = null) => { ... }

// Function to get vehicle variable details (to understand what fields are available)
export const getVehicleVariableDetails = async (variableId) => {
  try {
    const response = await fetch(`${NHTSA_BASE_URL}/GetVehicleVariableValuesList/${variableId}?format=json`);
     if (!response.ok) {
      throw new Error(`NHTSA API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.Results; // Array of possible values for that variable
  } catch (error) {
    console.error(`Error fetching variable details for ID ${variableId} from NHTSA:`, error);
    throw error;
  }
}; 