module.exports = (err, req, res, next) => {
  console.error('ERROR:', err);
  if (res.headersSent) return next(err);
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    errorCode: err.errorCode || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'VALIDATION_ERROR')
  });
};
