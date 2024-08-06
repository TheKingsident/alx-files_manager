import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const getStatus = async (req, res) => {
  try {
    const isRedisAlive = await redisClient.isAlive();
    const databaseStats = await dbClient.is
    const isDBAlive = await dbClient.isAlive();

    res.status(200).json({ redis: isRedisAlive, db: isDBAlive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();

    res.status(200).json({ users: nbUsers, files: nbFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getStatus, getStats };
