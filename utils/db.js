import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
    constructor() {
      const host = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || 27017;
      const database = process.env.DB_DATABASE || 'files_manager';

      const uri = `mongodb://${host}:${port}/`;
      this.client = new MongoClient(uri, { useNewUrlParser: true,
        useUnifiedTopology: true });
      this.client.connect()
        .then(() => {
          this.db = this.client.db(database);
        }) 
        .catch((error) => console.error(error));
      }

    isAlive() {
      return this.client.isConnected();
    }

    async nbUsers() {
      try {
        return this.db.collection('users').countDocuments();
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    async nbFiles() {
      try {
        return this.db.collection('files').countDocuments();
      } catch (error) {
        console.error(error);
        return false;
      }
    }
}

const dbClient = new DBClient();

export default dbClient;
