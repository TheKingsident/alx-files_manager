import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';

class FilesController {
  // postUpload method
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
  // unpublish method
  static async unpublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.files.findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.files.updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: false } }
      );

      const updatedFile = await dbClient.files.findOne({ _id: new ObjectId(fileId) });

      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  //getShow method
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.files.findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  //getIndex method
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const parentId = parseInt(req.query.parentId, 10) || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      const query = {
        userId: new ObjectId(userId),
        parentId: parentId === 0 ? 0 : new ObjectId(parentId),
      };
  
      console.log('Query:', query);
  
      const files = await dbClient.files.aggregate([
        { $match: query },
        { $sort: { _id: 1 } },
        { $skip: page * pageSize },
        { $limit: pageSize }
      ]).toArray();
  
      console.log('Files:', files);
  
      return res.status(200).json(files);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // putPublish method
  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.files.findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.files.updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: true } }
      );

      const updatedFile = await dbClient.files.findOne({ _id: new ObjectId(fileId) });
      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // putUnpublish method
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.files.findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.files.updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { isPublic: false } }
      );

      const updatedFile = await dbClient.files.findOne({ _id: new ObjectId(fileId) });
      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // getFile method
  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    try {
      const file = await dbClient.files.findOne({ _id: new ObjectId(fileId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (!file.isPublic) {
        if (!token) {
          return res.status(404).json({ error: 'Not found' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId || userId !== file.userId.toString()) {
          return res.status(404).json({ error: 'Not found' });
        }
      }

      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      if (!fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      const fileContent = fs.readFileSync(file.localPath);

      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(fileContent);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;