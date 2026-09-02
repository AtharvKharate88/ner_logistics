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
import { geometryToLatLngs, normalizeRiskLevel } from "../../utils/routeFormat";
import "./RouteMap.css";

//importing carto api key
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NER_CENTER = [26.2, 92.9];
const NER_ZOOM = 6;

function routeStroke(route, recommendedId, selectedId) {
  const isSelected = route.routeId === selectedId;
  const isRecommended = route.routeId === recommendedId;
  const level = normalizeRiskLevel(route?.risk?.level);

  if (isSelected || isRecommended) {
    return {
      color: "var(--map-recommended, #52B788)",
      weight: isSelected ? 6 : 5,
      opacity: 0.95,
    };
  }

  if (level === "HIGH") {
    return { color: "#E63946", weight: 3.5, opacity: 0.75 };
  }
  if (level === "MEDIUM") {
    return { color: "#F4A261", weight: 3.5, opacity: 0.75 };
  }
  return { color: "#C9A227", weight: 3, opacity: 0.65 };
}

function FitRoutes({ routeLatLngGroups, markers }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...routeLatLngGroups.flat(),
      ...markers.map((marker) => marker.position),
    ];

    if (!points.length) {
      map.setView(NER_CENTER, NER_ZOOM);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [map, routeLatLngGroups, markers]);

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
  emptyMessage = "Enter your origin and destination to generate route recommendations.",
}) {
  const prepared = useMemo(() => {
    return routes
      .map((route) => ({
        route,
        latLngs: geometryToLatLngs(route.geometry),
      }))
      .filter((item) => item.latLngs.length > 1);
  }, [routes]);

  const markers = useMemo(() => {
    const list = [];
    if (
      originCoordinates &&
      Number.isFinite(originCoordinates.lat) &&
      Number.isFinite(originCoordinates.lon)
    ) {
      list.push({
        key: "origin",
        position: [originCoordinates.lat, originCoordinates.lon],
        label: originLabel || "Origin",
      });
    }
    if (
      destinationCoordinates &&
      Number.isFinite(destinationCoordinates.lat) &&
      Number.isFinite(destinationCoordinates.lon)
    ) {
      list.push({
        key: "destination",
        position: [destinationCoordinates.lat, destinationCoordinates.lon],
        label: destinationLabel || "Destination",
      });
    }
    return list;
  }, [originCoordinates, destinationCoordinates, originLabel, destinationLabel]);

  const hasGeometry = prepared.length > 0;
  const showEmpty = !routes.length;

  return (
    <section className="route-map" aria-label="Route map">
      <div className="route-map__frame">
        <MapContainer
          center={NER_CENTER}
          zoom={NER_ZOOM}
          className="route-map__leaflet"
          scrollWheelZoom
        >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`}
              subdomains={["a", "b", "c", "d"]}
              maxZoom={20}
            />

            {/* <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            /> */}

          <FitRoutes
            routeLatLngGroups={prepared.map((item) => item.latLngs)}
            markers={markers}
          />

          {prepared.map(({ route, latLngs }) => {
            const style = routeStroke(route, recommendedRouteId, selectedRouteId);
            return (
              <Polyline
                key={route.routeId}
                positions={latLngs}
                pathOptions={{
                  color: style.color.startsWith("var")
                    ? "#52B788"
                    : style.color,
                  weight: style.weight,
                  opacity: style.opacity,
                }}
              />
            );
          })}

          {markers.map((marker) => (
            <Marker key={marker.key} position={marker.position}>
              <Popup>{marker.label}</Popup>
            </Marker>
          ))}
        </MapContainer>

        {showEmpty ? (
          <div className="route-map__overlay">
            <p>{emptyMessage}</p>
          </div>
        ) : null}

        {!showEmpty && !hasGeometry ? (
          <div className="route-map__overlay route-map__overlay--soft">
            <p>
              Route metrics are available, but geometry was not returned for map
              rendering.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RouteMap;
