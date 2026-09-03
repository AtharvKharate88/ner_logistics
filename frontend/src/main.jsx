import React from "react";
import ReactDOM from "react-dom/client";

//importing leaflet for maps
import "leaflet/dist/leaflet.css";

//importing custom styling files
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles.css";

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);