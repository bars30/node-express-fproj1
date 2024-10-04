require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a PostgreSQL connection pool using explicit parameters
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

// Connect to the PostgreSQL database and send a response
app.get('/data', async (req, res) => {
    try {
        // Get a client from the pool
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        
        // Send a success message as JSON
        res.status(200).json({
            message: 'Connected to PostgreSQL database',
            data: '777'  // Your additional data or message
        });

        // Release the client back to the pool
        client.release();
    } catch (err) {
        console.error('Connection error', err.stack);
        // Send an error message if there is an issue with the database connection
        res.status(500).json({
            error: 'Error connecting to PostgreSQL database',
            details: err.stack
        });
    }
});

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

// Export the Express app as a serverless function 
module.exports = app