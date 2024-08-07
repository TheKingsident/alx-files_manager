import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const existingUser = await dbClient.users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const result = await dbClient.users.insertOne({ email, password: hashedPassword });

      const newUser = {
        email,
        id: result.insertedId,
      };

      res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.users.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;