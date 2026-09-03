import { useEffect, useMemo } from "react";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  geometryToLatLngs,
  normalizeRiskLevel,
} from "../../utils/routeFormat";

import "./RouteMap.css";

// CARTO API key
const CARTO_API_KEY =
  import.meta.env.VITE_CARTO_API_KEY;

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NER_CENTER = [26.2, 92.9];
const NER_ZOOM = 6;

// Decide route stroke styling
function routeStroke(
  route,
  recommendedId,
  selectedId
) {
  const isSelected =
    route.routeId === selectedId;

  const isRecommended =
    route.routeId === recommendedId;

  const level =
    normalizeRiskLevel(
      route?.risk?.level
    );

  // Selected route
  if (isSelected) {
    return {
      color: "#52B788",
      weight: 6,
      opacity: 1,
    };
  }

  // Recommended route
  if (isRecommended) {
    return {
      color: "#52B788",
      weight: 5,
      opacity: 0.9,
    };
  }

  // Alternative routes
  if (level === "HIGH") {
    return {
      color: "#E63946",
      weight: 3.5,
      opacity: 0.8,
    };
  }

  if (level === "MEDIUM") {
    return {
      color: "#F4A261",
      weight: 3.5,
      opacity: 0.8,
    };
  }

  return {
    color: "#C9A227",
    weight: 3,
    opacity: 0.75,
  };
}

// Fix Leaflet rendering after page navigation/layout changes
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => {
      map.invalidateSize();
    };

    // Immediate resize
    resizeMap();

    // Resize after layout settles
    const timeoutOne =
      setTimeout(resizeMap, 100);

    const timeoutTwo =
      setTimeout(resizeMap, 300);

    window.addEventListener(
      "resize",
      resizeMap
    );

    return () => {
      clearTimeout(timeoutOne);
      clearTimeout(timeoutTwo);

      window.removeEventListener(
        "resize",
        resizeMap
      );
    };
  }, [map]);

  return null;
}

// Automatically fit all route geometry
function FitRoutes({
  routeLatLngGroups,
  markers,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...routeLatLngGroups.flat(),
      ...markers.map(
        (marker) => marker.position
      ),
    ];

    if (!points.length) {
      map.setView(
        NER_CENTER,
        NER_ZOOM
      );

      return;
    }

    if (points.length === 1) {
      map.setView(
        points[0],
        9
      );

      return;
    }

    const bounds =
      L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 11,
    });

    // Important for maps rendered after navigation
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [
    map,
    routeLatLngGroups,
    markers,
  ]);

  return null;
}

function RouteMap({
  routes = [],
  selectedRouteId = null,
  recommendedRouteId = null,
  originLabel = "",
  destinationLabel = "",
  originCoordinates = null,
  destinationCoordinates = null,

  // Optional extra class for pages using this component
  className = "",

  emptyMessage =
    "Enter your origin and destination to generate route recommendations.",
}) {
  // Convert GeoJSON coordinates into Leaflet coordinates
  const prepared = useMemo(() => {
    return routes
      .map((route) => ({
        route,

        latLngs:
          geometryToLatLngs(
            route.geometry
          ),
      }))

      .filter(
        (item) =>
          item.latLngs.length > 1
      );
  }, [routes]);

  // Prepare origin and destination markers
  const markers = useMemo(() => {
    const list = [];

    if (
      originCoordinates &&
      Number.isFinite(
        originCoordinates.lat
      ) &&
      Number.isFinite(
        originCoordinates.lon
      )
    ) {
      list.push({
        key: "origin",

        position: [
          originCoordinates.lat,
          originCoordinates.lon,
        ],

        label:
          originLabel ||
          "Origin",
      });
    }

    if (
      destinationCoordinates &&
      Number.isFinite(
        destinationCoordinates.lat
      ) &&
      Number.isFinite(
        destinationCoordinates.lon
      )
    ) {
      list.push({
        key: "destination",

        position: [
          destinationCoordinates.lat,
          destinationCoordinates.lon,
        ],

        label:
          destinationLabel ||
          "Destination",
      });
    }

    return list;
  }, [
    originCoordinates,
    destinationCoordinates,
    originLabel,
    destinationLabel,
  ]);

  const hasGeometry =
    prepared.length > 0;

  const showEmpty =
    !routes.length;

  // Use CARTO dark tiles
  const tileUrl = CARTO_API_KEY
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <section
      className={`route-map ${className}`}
      aria-label="Route map"
    >
      <div className="route-map__frame">

        <MapContainer
          center={NER_CENTER}
          zoom={NER_ZOOM}
          className="route-map__leaflet"
          scrollWheelZoom
        >

          {/* Fix map sizing after React Router navigation */}
          <MapResizer />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

            url={tileUrl}

            subdomains={[
              "a",
              "b",
              "c",
              "d",
            ]}

            maxZoom={20}
          />

          {/* Fit routes and markers inside the map */}
          <FitRoutes
            routeLatLngGroups={
              prepared.map(
                (item) =>
                  item.latLngs
              )
            }

            markers={markers}
          />

          {/* Draw all routes */}
          {prepared.map(
            ({
              route,
              latLngs,
            }) => {
              const style =
                routeStroke(
                  route,
                  recommendedRouteId,
                  selectedRouteId
                );

              return (
                <Polyline
                  key={
                    route.routeId
                  }

                  positions={
                    latLngs
                  }

                  pathOptions={{
                    color:
                      style.color,

                    weight:
                      style.weight,

                    opacity:
                      style.opacity,
                  }}
                />
              );
            }
          )}

          {/* Origin and destination */}
          {markers.map(
            (marker) => (
              <Marker
                key={
                  marker.key
                }

                position={
                  marker.position
                }
              >
                <Popup>
                  {
                    marker.label
                  }
                </Popup>
              </Marker>
            )
          )}

        </MapContainer>

        {/* Empty state */}
        {showEmpty ? (
          <div className="route-map__overlay">

            <p>
              {
                emptyMessage
              }
            </p>

          </div>
        ) : null}

        {/* Geometry unavailable */}
        {!showEmpty &&
        !hasGeometry ? (
          <div
            className="
              route-map__overlay
              route-map__overlay--soft
            "
          >
            <p>
              Route metrics are
              available, but geometry
              was not returned for
              map rendering.
            </p>
          </div>
        ) : null}

      </div>
    </section>
  );
}

export default RouteMap;