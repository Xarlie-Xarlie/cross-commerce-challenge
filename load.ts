import express from 'express';
import cors from 'cors';

const load = express();

load.use(express.json());
load.use(cors());

load.locals.sortedData = [];

load.get('/working', (request, response) => {
  return response.json({ message: 'server is working' });
});

load.get('/transform', (request, response) => {
  return response.status(200).json({ SortedData: load.locals.sortedData });
});

export default load;
