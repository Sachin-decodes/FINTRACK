export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', errors: err.issues });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid resource identifier' });
  if (err.code === 11000) return res.status(409).json({ message: 'A record with these values already exists' });
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
}
