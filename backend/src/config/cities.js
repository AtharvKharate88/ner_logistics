const { AppError } = require('../middleware/error.middleware');

// Coordinates reused from route-engine/scripts/validate_routes.py
const CITY_COORDINATES = {
  guwahati: { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
  shillong: { name: 'Shillong', lat: 25.5788, lon: 91.8933 },
  imphal: { name: 'Imphal', lat: 24.817, lon: 93.9368 },
  kohima: { name: 'Kohima', lat: 25.6751, lon: 94.1086 },
  itanagar: { name: 'Itanagar', lat: 27.0844, lon: 93.6053 },
  aizawl: { name: 'Aizawl', lat: 23.7271, lon: 92.7176 }
};

const normalizePlace = (value) => String(value).trim().toLowerCase();

const supportedPlaces = () => Object.values(CITY_COORDINATES).map((city) => city.name);

const resolvePlace = (value, fieldName) => {
  if (value && typeof value === 'object' && Number.isFinite(value.lat) && Number.isFinite(value.lon)) {
    return { lat: value.lat, lon: value.lon, label: `${value.lat},${value.lon}` };
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const match = CITY_COORDINATES[normalizePlace(value)];
  if (!match) {
    throw new AppError(
      `Unknown ${fieldName} '${value}'. Supported places: ${supportedPlaces().join(', ')}.`,
      400
    );
  }

  return { lat: match.lat, lon: match.lon, label: match.name };
};

module.exports = {
  CITY_COORDINATES,
  resolvePlace,
  supportedPlaces
};
