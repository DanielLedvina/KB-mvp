// Wraps async route handlers so thrown errors are forwarded to errorHandler
// instead of crashing the server with an unhandled promise rejection.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
