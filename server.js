import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes/index';

const app = express();
app.use(bodyParser.json());

app.use('/', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;