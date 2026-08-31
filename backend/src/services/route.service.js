const { AppError } = require('../middleware/error.middleware');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || process.env.ROUTE_ENGINE_URL || 'http://127.0.0.1:8001';
const REQUEST_TIMEOUT_MS = Number(process.env.PYTHON_SERVICE_TIMEOUT_MS || 600000);

const pythonUnavailable = () =>
  new AppError('Routing service temporarily unavailable', 503);

const pythonMessage = (body) => {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body.detail === 'string') {
    return body.detail;
  }
  if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
    return body.detail[0].msg;
  }
  return body?.message || 'Route engine request failed.';
};

const requestJson = async (path, options = {}) => {
  if (typeof fetch !== 'function') {
    throw new AppError('Node fetch is unavailable in this runtime.', 500);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = pythonMessage(body);
      if (response.status === 400 && /no path exists/i.test(message)) {
        throw new AppError('No feasible route found between the selected locations.', 404);
      }
      throw new AppError(message, response.status >= 500 ? 503 : response.status || 502);
    }

    return body;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw pythonUnavailable();
    }
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      throw pythonUnavailable();
    }
    if (error.name === 'TypeError' || error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
      throw pythonUnavailable();
    }
    throw pythonUnavailable();
  } finally {
    clearTimeout(timer);
  }
};

const planRoute = async (enginePayload) => {
  const response = await requestJson('/routes/plan', {
    method: 'POST',
    body: JSON.stringify(enginePayload)
  });

  if (!response || typeof response !== 'object' || !Array.isArray(response.routes)) {
    throw new AppError('Routing service returned a malformed response.', 502);
  }

  return response;
};

const getSegmentRisk = async (segmentId, departureDate) => {
  const params = new URLSearchParams({ date: departureDate });
  return requestJson(`/risk/segment/${encodeURIComponent(segmentId)}?${params.toString()}`);
};

module.exports = {
  planRoute,
  getSegmentRisk,
  PYTHON_SERVICE_URL,
  RouteServiceError: AppError
};
