import React, { useEffect, useRef } from "react";
import ReactMapGL from "react-map-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../constants";

const initialViewState = {
  latitude: DEFAULT_MAP_CENTER[1],
  longitude: DEFAULT_MAP_CENTER[0],
  zoom: DEFAULT_MAP_ZOOM,
};

export default function Map({ children, mapCenter }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapCenter?.length) return;
    mapRef.current?.flyTo({ center: mapCenter, speed: 10 });
  }, [mapCenter]);

  return (
    <ReactMapGL
      ref={mapRef}
      initialViewState={initialViewState}
      style={{ height: "100vh" }}
      mapStyle="mapbox://styles/theprof/cl8nwpgtl004z15mi7tjvhoaf"
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      {children}
    </ReactMapGL>
  );
}
