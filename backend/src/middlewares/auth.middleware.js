const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function unauthorized(message) {
  return new AppError(401, 'UNAUTHORIZED', message);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Authentification requise'));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub };
    next();
  } catch {
    return next(unauthorized('Jeton invalide ou expiré'));
  }
}

module.exports = { requireAuth };