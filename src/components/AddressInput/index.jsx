import React, { useState } from "react";
import getPlaces from "../../api/getPlaces";
import "./AddressInput.scss";

export default function AddressInput({
  onManualInputChange,
  setAddress,
  placeName,
  ...others
}) {
  // State to store suggestions from the API
  const [suggestions, setSuggestions] = useState([]);

  // Function to query places based on user input
  const queryPlaces = async (query) => {
    try {
      // Call the getPlaces API to fetch location suggestions
      const res = await getPlaces(query);

      // Update the state with the retrieved suggestions
      setSuggestions(res.features);
    } catch (error) {
      console.error("Error querying places:", error);
    }
  };

  // Handle input change event
  const handleChange = (event) => {
    // Call the provided onManualInputChange function to handle manual input change
    onManualInputChange(event, "placeName");

    // Query places based on the input value
    queryPlaces(event.target.value);
  };

  // Handle selecting a suggestion from the list
  const handleSelectSuggestion = ({ place_name, center }) => {
    // Create an address object from the selected suggestion
    const address = {
      placeName: place_name,
      longitude: center[0],
      latitude: center[1],
    };

    // Set the address using the provided setAddress function
    setAddress(address);

    // Clear the suggestions
    setSuggestions([]);
  };

  return (
    <div className="address-input-container">
      {/* Input field for manual input */}
      <input type="text" value={placeName} onChange={handleChange} {...others} />

      {/* Display the list of suggestions */}
      <ul className="address-suggestions">
        {suggestions?.map((suggestion, index) => (
          <li key={index} onClick={() => handleSelectSuggestion(suggestion)}>
            {suggestion.place_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
