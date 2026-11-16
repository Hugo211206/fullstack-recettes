const express = require('express');
const app = express();
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const recipeRoutes = require('./routes/recipe.routes');

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/recipes', recipeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;