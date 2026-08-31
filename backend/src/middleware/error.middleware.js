class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number(err.statusCode) || 500;
  const expose = err instanceof AppError || (statusCode >= 400 && statusCode < 500) || statusCode === 503;
  const message = expose ? (err.message || 'Request failed.') : 'Internal server error.';

  if (statusCode >= 500) {
    console.error(err.message);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};
