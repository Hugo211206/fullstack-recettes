const express = require('express');
const app = express();
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const recipeRoutes = require('./routes/recipe.routes');
const authRoutes = require('./routes/auth.routes');
const { requireAuth } = require('./middlewares/auth.middleware');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const openapiDocument = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/recipes', requireAuth, recipeRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;