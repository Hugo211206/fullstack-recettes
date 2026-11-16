const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Route introuvable'));
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Corps JSON invalide' },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
  });
}

module.exports = { notFoundHandler, errorHandler };