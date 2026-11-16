const express = require('express');
const app = express();
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;