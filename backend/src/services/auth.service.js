const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

function signToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function emailAlreadyUsed() {
  return new AppError(409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé');
}

async function register(email, password) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw emailAlreadyUsed();
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await User.create({ email, passwordHash });
  } catch (err) {
    if (err.code === 11000) {
      throw emailAlreadyUsed();
    }
    throw err;
  }

  return {
    user: { id: user.id, email: user.email },
    token: signToken(user),
  };
}

async function login(email, password) {
  const user = await User.findOne({ email });

  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!passwordOk) {
    throw new AppError(401, 'UNAUTHORIZED', 'Email ou mot de passe incorrect');
  }

  return {
    user: { id: user.id, email: user.email },
    token: signToken(user),
  };
}

module.exports = { register, login };