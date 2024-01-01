// Importing constants from the "../constants" module
import { DEFAULT_SEARCH_PLACE_RADIUS } from "../constants";

/**
 * Searches for places based on specified parameters.
 *
 * @param {string} placeType - The type of place to search for.
 * @param {object} coord - The coordinates (latitude and longitude) for the search.
 * @param {number} radius - The search radius (optional, uses default if not provided).
 * @returns {Promise} A promise that resolves to the JSON response from the API.
 */
export default async function searchPlaces(placeType, coord, radius) {
  try {
    // Constructing the API URL for searching places
    const apiUrl = `${process.env.REACT_APP_API_URL}/search-places?latitude=${coord.latitude}&longitude=${coord.longitude}&radius=${radius || DEFAULT_SEARCH_PLACE_RADIUS}&placeType=${placeType}`;

    // Making a fetch request to the API
    const response = await fetch(apiUrl);

    // Parsing and returning the JSON response
    return response.json();
  } catch (error) {
    // Logging an error message if there's an issue with the API request
    console.error("There was an error while searching places:", error);
  }
}
