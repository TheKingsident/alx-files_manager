import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      const { name, type, parentId = 0, isPublic = false, data } = req.body;

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      const validTypes = ['folder', 'file', 'image'];
      if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      let parentFile = null;
      if (parentId !== 0) {
        parentFile = await dbClient.files.findOne({ _id: new ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const newFile = {
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentFile ? parentFile._id : 0,
      };

      if (type === 'folder') {
        const result = await dbClient.files.insertOne(newFile);
        return res.status(201).json({
          id: result.insertedId,
          ...newFile,
        });
      } else {
        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(FOLDER_PATH)) {
          fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        const localPath = path.join(FOLDER_PATH, uuidv4());
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

        newFile.localPath = localPath;
        const result = await dbClient.files.insertOne(newFile);

        return res.status(201).json({
          id: result.insertedId,
          ...newFile,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;