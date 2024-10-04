require('dotenv').config();
const express = require('express');
// const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a new PostgreSQL client
// const client = new Client({
//     connectionString: process.env.DATABASE_URL,
// });

// Connect to the PostgreSQL database
// client.connect()
//     .then(() => console.log('Connected to PostgreSQL database'))
//     .catch(err => console.error('Connection error', err.stack));

// Define the /data route
app.get('/data', async (req, res) => {
    try {
        // Example query (modify as needed)
        
        res.send(`Here is your data: 777`);
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Error fetching data');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
