const Route = require('../models/Route');

const ROUTE_ENGINE_URL = process.env.ROUTE_ENGINE_URL || 'http://127.0.0.1:8001';

class RouteServiceError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'RouteServiceError';
    this.statusCode = statusCode;
  }
}

const postJson = async (url, payload) => {
  if (typeof fetch !== 'function') {
    throw new RouteServiceError('Node fetch is unavailable in this runtime.', 500);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.detail || body?.message || 'Route engine request failed.';
    throw new RouteServiceError(message, response.status || 502);
  }

  return body;
};

const planRoute = async (requestPayload) => {
  const response = await postJson(`${ROUTE_ENGINE_URL}/routes/plan`, requestPayload);

  try {
    await Route.create({
      request: requestPayload,
      response
    });
  } catch (error) {
    console.error('Route save failed:', error.message);
  }

  return response;
};

const getRouteById = async (routeId) => {
  return Route.findById(routeId).lean();
};

module.exports = {
  planRoute,
  getRouteById,
  RouteServiceError
};
