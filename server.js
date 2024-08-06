const express = require('express');
const cors = require('cors');
const dbClient = require('./db');
const redisClient = require('./redis');
const AppController = require('./controllers/AppController');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
