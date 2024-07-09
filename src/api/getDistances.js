/**
 * Get distinations from sources to destinations
 *
 * @param {*} coordinates includes both sources and destinations
 * sample format: 106.729681,10.879889;106.7508457,10.875569;106.7579162,10.8715499
 * @param {*} sourceElements source indexes: 0 => 106.729681,10.879889
 * @param {*} destinationElements destination indexes: 1 => 106.7508457,10.875569
 *
 * @returns array object includes `distance` value
 */
export default async function getDistances(
  coordinates
) {
  try {
    const apiUrl = `https://router.project-osrm.org/table/v1/car/${coordinates}?sources=0&destinations=all&annotations=distance`;
    const response = await fetch(apiUrl);

    return response.json();
  } catch (error) {
    console.error("There was an error while fetching directions:", error);
  }
}
