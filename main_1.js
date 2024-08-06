import dbClient from './utils/db';

// Helper function to wait for the MongoDB client to be connected
const waitConnection = async () => {
    let retries = 10;
    while (retries > 0) {
        if (dbClient.client.isConnected()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries -= 1;
    }
    throw new Error('Failed to connect to MongoDB after several retries');
};

(async () => {
    try {
        console.log('Checking if connected...');
        console.log(dbClient.client.isConnected()); // Deprecated method, should be replaced
        await waitConnection();
        console.log('Connected to MongoDB');
        console.log('User count:', await dbClient.nbUsers());
        console.log('File count:', await dbClient.nbFiles());
    } catch (error) {
        console.error('Error:', error);
    }
})();
