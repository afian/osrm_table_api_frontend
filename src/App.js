import React, { useEffect, useMemo, useState } from "react";
import { Marker } from "react-map-gl";
import _flatten from "lodash/flatten";
import _orderBy from "lodash/orderBy";

import Map from "./components/Map";
import Polyline from "./components/Polyline";
import AutoCompleteInput from "./components/AddressInput";
import Rating from "./components/Rating";
import Pricing from "./components/Pricing";

import getDirection from "./api/getDirection";
import searchPlaces from "./api/searchPlaces";
import getDistances from "./api/getDistances";

import {
  PRICE_OPTIONS,
  RATING_OPTIONS,
  RESTAURANT_PLACE_TYPE,
} from "./constants";

import SearchIcon from "./assets/images/search.svg";
import HomeIcon from "./assets/images/home.svg";
import StarRateIcon from "./assets/images/star_rate.svg";
import MonetizationIcon from "./assets/images/monetization_on.svg";
import StopIcon from "./assets/images/stop.svg";
import StopActiveIcon from "./assets/images/stop_active.svg";
import RestaurantImg from "./assets/images/default_restaurant.webp";

import "mapbox-gl/dist/mapbox-gl.css";
import "./App.scss";

export default function App() {
  // State variables
  const [polylineCoordinates, setPolylineCoordinates] = useState([]);
  const [yourLocation, setYourLocation] = useState({
    placeName: "",
    latitude: "",
    longitude: "",
  });
  const [mapCenter, setMapCenter] = useState([]);
  const [originRestaurants, setOriginRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(undefined);

  // Update map center when yourLocation changes
  useEffect(() => {
    if (!yourLocation.latitude || !yourLocation.longitude) return;
    setMapCenter([yourLocation.longitude, yourLocation.latitude]);
  }, [yourLocation.latitude, yourLocation.longitude]);

  // Get direction to the nearest restaurant and update polyline coordinates
  const getDirectionToNearestRestaurant = async (restaurantList) => {
    if (!restaurantList?.length) {
      setPolylineCoordinates([]);
      return;
    }

    const sortedRestaurants = await _orderBy(restaurantList || [], "distance");
    const res = await getDirection(yourLocation, {
      latitude: sortedRestaurants[0]?.geometry?.location?.lat,
      longitude: sortedRestaurants[0]?.geometry?.location?.lng,
    });

    const firstRoute = res.routes[0];
    const polylineCoordinatesTmp = _flatten(
      firstRoute?.legs[0]?.steps.map((step) => step.geometry.coordinates)
    );
    setPolylineCoordinates(polylineCoordinatesTmp);
  };

  useEffect(() => {
    applyFilters();
  }, [originRestaurants]);

  // Update map center when yourLocation or restaurants change
  useEffect(() => {
    getDirectionToNearestRestaurant(restaurants || []);
  }, [restaurants]);

  // Handle manual input change for your location
  const handleManualYourLocationInputChange = (event) => {
    const newYourLocation = {
      ...yourLocation,
      placeName: event.target.value,
    };
    setYourLocation(newYourLocation);
  };

  // Fetch distances to places and update the restaurant list
  const fulfillDistanceToPlaces = async (restaurantList) => {
    const coordinates = `${yourLocation.longitude},${yourLocation.latitude};${restaurantList
      ?.map(
        (item) =>
          `${item?.geometry?.location?.lng},${item?.geometry?.location?.lat}`
      )
      ?.join(";")}`;

      console.log("--- coordinates ---");
      console.log(coordinates);

    try {
      const placeDistances = await getDistances(coordinates);

      console.log("--- placeDistances ---");
      console.log(placeDistances);

      const distances = placeDistances.distances[0];

      console.log("--- distances ---");
      console.log(distances);

      return restaurantList.map((item, idx) => ({
        ...item,
        distance: distances[idx + 1],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle searching for places
  const handleSearchPlaces = async () => {
    try {
      setLoading(true);
      const placesRes = await searchPlaces(RESTAURANT_PLACE_TYPE, yourLocation);
      const placesWithDistance = await fulfillDistanceToPlaces(placesRes);

      console.log(placesWithDistance);

      setOriginRestaurants(_orderBy(placesWithDistance || [], "distance"));
    } finally {
      setLoading(false);
    }
  };

  // Open Google Maps for a specific location
  const handleGoToPlace = (latitude, longitude) => {
    if (!latitude || !longitude || typeof window === "undefined") return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`,
      "_blank"
    );
  };

  // Apply both pricing and rating filters
  const applyFilters = () => {
    const ratingFilterValue = +(document.getElementById("ratingFilter").value || 0);
    const pricingFilterValue = +(document.getElementById("pricingFilter").value || 0);
    const filteredRestaurants = originRestaurants.filter(
      ({ price_level, rating }) => 
        (!pricingFilterValue || +price_level === pricingFilterValue) &&
        (!ratingFilterValue || +rating >= ratingFilterValue)
    );
    setRestaurants(filteredRestaurants);
  };

  // Render the address input box
  const renderAddressBox = () => (
    <>
      <label>Your location</label>
      <div className="address-box-search">
        <AutoCompleteInput
          setAddress={setYourLocation}
          onManualInputChange={handleManualYourLocationInputChange}
          placeName={yourLocation.placeName}
          placeholder="Your location"
        />
        <button
          onClick={handleSearchPlaces}
          disabled={loading || !yourLocation.latitude}
        >
          <img width={24} alt="Search places icon" src={SearchIcon} />
        </button>
      </div>
    </>
  );

  // Render the pricing filter dropdown
  const renderPricingFilter = () => (
    <div className="filter-element">
      <img width={20} alt="Pricing filter icon" src={MonetizationIcon} />
      <select id="pricingFilter" onChange={applyFilters}>
        {PRICE_OPTIONS.map(({ value, name }) => (
          <option value={value} key={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );

  // Render the rating filter dropdown
  const renderRatingFilter = () => (
    <div className="filter-element">
      <img width={20} alt="Star rate icon" src={StarRateIcon} />
      <select id="ratingFilter" onChange={applyFilters}>
        {RATING_OPTIONS.map(({ value, name }) => (
          <option value={value} key={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );

  // Memoized rendering of restaurant list
  const renderRestaurants = useMemo(
    () => (
      <div className="restaurant-list">
        {restaurants.map(
          ({
            rating,
            user_ratings_total,
            price_level,
            name,
            vicinity,
            reference,
            photos,
            geometry,
            distance,
          }) => (
            <div
              className="restaurant-item"
              key={reference}
              onMouseEnter={() => setActive(reference)}
              onMouseLeave={() => setActive(undefined)}
              onClick={() =>
                handleGoToPlace(
                  geometry?.location?.lat,
                  geometry?.location?.lng
                )
              }
            >
              <div className="detail-info">
                <img
                  className="left-image"
                  alt="Address control icon"
                  src={
                    photos?.length > 0
                      ? `${process.env.REACT_APP_API_URL}/google-image?photo_reference=${photos[0].photo_reference}&maxwidth=400`
                      : RestaurantImg
                  }
                />
                <div className="right-info">
                  <p className="rating">
                    {rating || 0} <Rating rating={rating || 0} /> (
                    {user_ratings_total || 0})
                  </p>
                  <p className="rating">
                    <Pricing priceLevel={price_level || 0} />
                  </p>
                  <p>Distance: {distance} m</p>
                </div>
              </div>
              <p className="name">{name}</p>
              <p className="address">{vicinity}</p>
            </div>
          )
        )}
      </div>
    ),
    [restaurants]
  );

  // Main rendering of the App component
  return (
    <div className="App">
      <div className="address-box">
        {renderAddressBox()}
        <div className="filter-box">
          {renderPricingFilter()}
          {renderRatingFilter()}
        </div>
        {renderRestaurants}
      </div>
      <Map mapCenter={mapCenter}>
        {polylineCoordinates.length > 0 && <Polyline coordinates={polylineCoordinates} />}
        {yourLocation.latitude && (
          <Marker
            longitude={yourLocation.longitude}
            latitude={yourLocation.latitude}
          >
            <img alt="Your location" src={HomeIcon} style={{ width: 30 }} />
          </Marker>
        )}
        {restaurants?.map(({ geometry, name, reference }) => (
          <Marker
            key={reference}
            longitude={geometry?.location?.lng}
            latitude={geometry?.location?.lat}
            name={name}
          >
            <img
              alt={name}
              src={active === reference ? StopActiveIcon : StopIcon}
              style={{ width: 30 }}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
