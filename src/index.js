import React from "react";
import { createRoot } from 'react-dom/client';
import "mapbox-gl/dist/mapbox-gl.css";

import App from "./App";

import "./index.scss";

const root = document.getElementById('root');
const reactRoot = createRoot(root);
reactRoot.render(<App />);