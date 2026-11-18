const authService = require('../services/auth.service');

async function register(req, res) {
  const result = await authService.register(req.body.email, req.body.password, req.body.username);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.login(req.body.email, req.body.password);
  res.status(200).json(result);
}

module.exports = { register, login };