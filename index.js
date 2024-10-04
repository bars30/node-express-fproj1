require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a new PostgreSQL client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// Connect to the PostgreSQL database and send a response
app.get('/data', async (req, res) => {
    try {
        // Attempt to connect to the database
        await client.connect();
        console.log('Connected to PostgreSQL database');
        
        // Send a success message as JSON
        res.status(200).json({
            message: 'Connected to PostgreSQL database',
            data: '777'  // Your additional data or message
        });
    } catch (err) {
        console.error('Connection error', err.stack);
        // Send an error message if there is an issue with the database connection
        res.status(500).json({
            error: 'Error connecting to PostgreSQL database',
            details: err.stack
        });
    } finally {
        // Ensure the client is closed after use
        await client.end();
    }
});

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

// Export the Express app as a serverless function
module.exports = app;

console.log('nerb');

//--------
//  addded to print in doc