const { AppError } = require('./error.middleware');

const CARGO_TYPES = ['medicine', 'food', 'general', 'fuel', 'perishable'];
const VEHICLE_TYPES = {
  truck: 'Truck',
  minitruck: 'MiniTruck',
  van: 'Van',
  tempo: 'Tempo'
};

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const normalizePlaceName = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const validatePlanRoute = (req, res, next) => {
  const body = req.body || {};
  const { origin, destination, departureDate, cargoType, weight, vehicleType } = body;

  const originMissing =
    origin === undefined ||
    origin === null ||
    origin === '' ||
    (typeof origin === 'object' && !Number.isFinite(origin.lat));
  if (originMissing) {
    return next(new AppError('origin is required.', 400));
  }

  const destinationMissing =
    destination === undefined ||
    destination === null ||
    destination === '' ||
    (typeof destination === 'object' && !Number.isFinite(destination.lat));
  if (destinationMissing) {
    return next(new AppError('destination is required.', 400));
  }

  if (!departureDate) {
    return next(new AppError('departureDate is required and must use YYYY-MM-DD format.', 400));
  }
  if (!isValidDate(departureDate)) {
    return next(new AppError('departureDate is required and must use YYYY-MM-DD format.', 400));
  }

  if (typeof cargoType !== 'string' || !cargoType.trim()) {
    return next(new AppError('cargoType is required.', 400));
  }
  const cargo = cargoType.trim().toLowerCase();
  if (!CARGO_TYPES.includes(cargo)) {
    return next(
      new AppError(`unsupported cargoType. Allowed: ${CARGO_TYPES.join(', ')}.`, 400)
    );
  }

  if (weight === undefined || weight === null || weight === '') {
    return next(new AppError('weight is required and must be a number greater than 0.', 400));
  }
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight)) {
    return next(new AppError('weight is required and must be a number greater than 0.', 400));
  }
  if (numericWeight < 0) {
    return next(new AppError('weight cannot be negative.', 400));
  }
  if (numericWeight === 0) {
    return next(new AppError('weight must be greater than 0.', 400));
  }

  if (typeof vehicleType !== 'string' || !vehicleType.trim()) {
    return next(new AppError('vehicleType is required.', 400));
  }
  const vehicleKey = vehicleType.trim().toLowerCase().replace(/\s+/g, '');
  if (!VEHICLE_TYPES[vehicleKey]) {
    return next(
      new AppError(`unsupported vehicleType. Allowed: ${Object.values(VEHICLE_TYPES).join(', ')}.`, 400)
    );
  }

  if (
    typeof origin === 'string' &&
    typeof destination === 'string' &&
    normalizePlaceName(origin) === normalizePlaceName(destination)
  ) {
    return next(new AppError('origin and destination cannot be the same.', 400));
  }

  req.validatedPlan = {
    origin,
    destination,
    departureDate,
    cargoType: cargo,
    weight: numericWeight,
    vehicleType: VEHICLE_TYPES[vehicleKey]
  };

  return next();
};

const validateSegmentRiskQuery = (req, res, next) => {
  const departureDate = req.query.date;
  if (!departureDate) {
    return next(new AppError('date query parameter is required and must use YYYY-MM-DD format.', 400));
  }
  if (!isValidDate(String(departureDate))) {
    return next(new AppError('date query parameter is required and must use YYYY-MM-DD format.', 400));
  }
  req.query.date = String(departureDate);
  return next();
};

module.exports = {
  CARGO_TYPES,
  VEHICLE_TYPES,
  validatePlanRoute,
  validateSegmentRiskQuery
};
