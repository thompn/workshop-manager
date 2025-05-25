export const NHTSA_BASE_URL = '/api/nhtsa/vehicles';

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
    // Handled by API returning an error if VIN is too short or invalid
  }
  let url = `${NHTSA_BASE_URL}/DecodeVinValues/${vin}?format=json`;
  if (year) {
    url += `&modelyear=${year}`;
  }

  try {
    const response = await fetch(url);
    const responseDetails = {
        ErrorCode: "FETCH_ERROR", 
        ErrorText: "Client: Initial failure to fetch or parse VIN details.",
        Results: [],
        Message: "",
        SearchCriteria: `VIN: ${vin}${year ? ", Year: " + year : ""}`
    };

    if (!response.ok) {
      responseDetails.ErrorCode = `HTTP_ERROR_${response.status}`;
      let errorBodyText = "Could not read error body.";
      try {
          errorBodyText = await response.text();
          console.error(`NHTSA API non-OK response (${response.status}) for ${url}:`, errorBodyText);
      } catch (e) {
          console.error(`NHTSA API non-OK response (${response.status}) for ${url}, and failed to read body:`, e);
      }
      responseDetails.ErrorText = `NHTSA API returned status ${response.status}: ${response.statusText}. Body: ${errorBodyText.substring(0, 300)}`;
      return responseDetails;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.toLowerCase().includes("application/json")) {
      const data = await response.json();
      
      // Successfully parsed JSON, now use its content
      responseDetails.Message = data.Message || "";
      responseDetails.ErrorCode = data.ErrorCode !== undefined ? data.ErrorCode.toString() : "JSON_NO_ERROR_CODE";
      responseDetails.ErrorText = data.ErrorText || (data.ErrorCode !== undefined ? "" : "JSON parsed but no specific NHTSA ErrorCode or ErrorText provided.");
      responseDetails.SearchCriteria = data.SearchCriteria || responseDetails.SearchCriteria;
      responseDetails.Results = Array.isArray(data.Results) ? data.Results : [];

      if (responseDetails.Results.length > 0) {
        responseDetails.Results.forEach(item => {
          if (item.Variable) { 
            responseDetails[item.Variable] = item.Value; 
          }
        });
      }
      // If NHTSA ErrorCode is present and indicates an issue, ErrorText should reflect that.
      if (data.ErrorCode && data.ErrorCode !== "0" && data.ErrorCode !== "00" && !data.ErrorText) {
          responseDetails.ErrorText = `NHTSA API indicated an issue with ErrorCode: ${data.ErrorCode}.`;
      }

    } else {
      responseDetails.ErrorCode = "INVALID_CONTENT_TYPE";
      let responseBodyText = "Could not read non-JSON body.";
      try {
          responseBodyText = await response.text();
          console.warn(`NHTSA API OK response but non-JSON Content-Type (${contentType}) for ${url}:`, responseBodyText);
      } catch(e) {
          console.warn(`NHTSA API OK response but non-JSON Content-Type (${contentType}) for ${url}, and failed to read body:`, e);
      }
      responseDetails.ErrorText = `Expected JSON from NHTSA, got ${contentType || 'unknown content type'}. Body: ${responseBodyText.substring(0,300)}`;
    }
    
    return responseDetails;

  } catch (error) { 
    console.error(`Client-side network error or issue before/during fetch for ${url}:`, error);
    return {
        ErrorCode: "CLIENT_NETWORK_ERROR", 
        ErrorText: `Client-side error: ${error.message}`,
        Results: [],
        Message: "",
        SearchCriteria: `VIN: ${vin}${year ? ", Year: " + year : ""}`
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