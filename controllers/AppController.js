import dbClient from '../utils/db';

const redisClient = require('../utils/redis');
// const dbClient = require('../utils/db');

class AppController {
  // eslint-disable-next-line class-methods-use-this
  static async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();

    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  // eslint-disable-next-line class-methods-use-this
  static async getStats(req, res) {
    const usersCount = await dbClient.db.collection('users').countDocuments();
    const filesCount = await dbClient.db.collection('files').countDocuments();

    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;