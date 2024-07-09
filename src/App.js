import React, { useEffect, useMemo, useState } from "react";
import { Marker } from "react-map-gl";
import _orderBy from "lodash/orderBy";
import _flatten from "lodash/flatten";

import Map from "./components/Map";
import Polyline from "./components/Polyline";
import AutoCompleteInput from "./components/AddressInput";
import Rating from "./components/Rating";

import getDirection from "./api/getDirection";
import searchPlaces from "./api/searchPlaces";
import getDistances from "./api/getDistances";
import { PLACE_TYPE } from "./constants";

import SearchIcon from "./assets/images/search.svg";
import HomeIcon from "./assets/images/home.svg";
import StopIcon from "./assets/images/atm.svg";
import StopActiveIcon from "./assets/images/atm_active.svg";
import StopImg from "./assets/images/default_stop.webp";

import "mapbox-gl/dist/mapbox-gl.css";
import "./App.scss";

export default function App() {
  const [polylineCoordinates, setPolylineCoordinates] = useState([]);
  const [yourLocation, setYourLocation] = useState({ placeName: "", latitude: "", longitude: "" });
  const [mapCenter, setMapCenter] = useState([]);
  const [originStops, setOriginStops] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(undefined);  // Added the active state and its setter

  useEffect(() => {
    if (yourLocation.latitude && yourLocation.longitude) {
      setMapCenter([yourLocation.longitude, yourLocation.latitude]);
    }
  }, [yourLocation]);

  const fetchStops = async () => {
    setLoading(true);
    try {
      const places = await searchPlaces(PLACE_TYPE, yourLocation);
      const placesWithDistance = await calculateDistances(places);
      setOriginStops(_orderBy(placesWithDistance, "distance"));
    } catch (error) {
      console.error("Failed to fetch places:", error);
    } finally {
      setLoading(false);
    }
  };
  const calculateDistances = async (places) => {
    const coordinates = createCoordinateString(places);
    try {
      const response = await getDistances(coordinates);
      const distances = response.distances[0];
      return places.map((place, index) => ({
        ...place,
        distance: distances[index + 1],
      }));
    } catch (error) {
      console.error("Error calculating distances:", error);
      return places;
    }
  };

  const createCoordinateString = (places) =>
    `${yourLocation.longitude},${yourLocation.latitude};${places.map(({ geometry }) =>
      `${geometry.location.lng},${geometry.location.lat}`
    ).join(";")}`;

  const handleGoToPlace = (latitude, longitude) => {
    if (latitude && longitude && window) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, "_blank");
    }
  };

  useEffect(() => {
    const getDirectionToNearestStop = async (stops) => {
      const nearest = _orderBy(stops, "distance")[0];
      if (nearest) {
        const { routes } = await getDirection(yourLocation, {
          latitude: nearest.geometry.location.lat,
          longitude: nearest.geometry.location.lng,
        });
        if (routes.length > 0) {
          const coordinates = _flatten(routes[0].legs[0].steps.map(step => step.geometry.coordinates));
          setPolylineCoordinates(coordinates);
        }
      }
    };

    setStops(originStops);
    if (originStops.length > 0) {
      getDirectionToNearestStop(originStops);
    }
  }, [originStops, yourLocation]);

  const renderStops = useMemo(() => (
    <div className="stop-list">
      {stops.map((stop) => (
        <div
          className="stop-item"
          key={stop.reference}
          onMouseEnter={() => setActive(stop.reference)}
          onMouseLeave={() => setActive(undefined)}
          onClick={() => handleGoToPlace(stop.geometry.location.lat, stop.geometry.location.lng)}
        >
          <div className="detail-info">
            <img
              className="left-image"
              alt={stop.name}
              src={stop.photos?.length ? `${process.env.REACT_APP_API_URL}/google-image?photo_reference=${stop.photos[0].photo_reference}&maxwidth=400` : StopImg}
            />
            <div className="right-info">
              <div className="rating">
                {stop.rating && <Rating rating={stop.rating} />}
                {stop.user_ratings_total && <span>({stop.user_ratings_total})</span>}
              </div>
                <p>Distance: {stop.distance} m</p>
            </div>
          </div>
          <p className="name">{stop.name}</p>
          <p className="address">{stop.vicinity}</p>
        </div>
      ))}
    </div>
  ), [stops]);

  return (
    <div className="App">
      <div className="address-box">
        <label>Your location</label>
        <div className="address-box-search">
          <AutoCompleteInput
            setAddress={setYourLocation}
            onManualInputChange={(event) => setYourLocation({ ...yourLocation, placeName: event.target.value })}
            placeName={yourLocation.placeName}
            placeholder="Your location"
          />
          <button onClick={fetchStops} disabled={loading || !yourLocation.latitude}>
            <img width={24} alt="Search places icon" src={SearchIcon} />
          </button>
        </div>
        {renderStops}
      </div>
      <Map mapCenter={mapCenter}>
        {polylineCoordinates.length > 0 && <Polyline coordinates={polylineCoordinates} />}
        <Marker longitude={yourLocation.longitude} latitude={yourLocation.latitude}>
          <img alt="Your location" src={HomeIcon} style={{ width: 30 }} />
        </Marker>
        {stops.map(({ geometry, name, reference }) => (
          <Marker key={reference} longitude={geometry.location.lng} latitude={geometry.location.lat}>
            <img alt={name} src={reference === active ? StopActiveIcon : StopIcon} style={{ width: 30 }} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
