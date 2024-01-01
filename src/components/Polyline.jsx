import { Layer, Source } from "react-map-gl";

export default function Polyline({ coordinates, lineColor = "#4781E9" }) {
  const sourceData = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };

  const layerProps = {
    type: "line",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": lineColor,
      "line-width": 3,
    },
  };

  return (
    <Source type="geojson" data={sourceData}>
      <Layer {...layerProps} />
    </Source>
  );
}
