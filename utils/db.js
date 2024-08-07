import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.dbName = process.env.DB_DATABASE || 'files_manager';
    this.connected = false;
    this.client = null;
    this.db = null;
    this.files = null;
    this.users = null;
    this.connectClient();
  }

  async connectClient() {
    try {
      const client = await MongoClient
        .connect(`mongodb://${this.host}:${this.port}`,
          { useUnifiedTopology: true });
      this.client = client;
      this.connected = true;
      this.db = this.client.db(this.dbName);
      this.files = this.db.collection('files');
      this.users = this.db.collection('users');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return this.users.countDocuments();
  }

  async nbFiles() {
    return this.files.countDocuments();
  }

  async uploadFile(data) {
    await this.files.insertOne(data);
    const newFile = await this.files.findOne(data);
    return newFile;
  }
}

const dbClient = new DBClient();
export default dbClient;