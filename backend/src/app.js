const express = require('express');
const app = express();
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const recipeRoutes = require('./routes/recipe.routes');
const authRoutes = require('./routes/auth.routes');
const { requireAuth } = require('./middlewares/auth.middleware');

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/recipes', requireAuth, recipeRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;