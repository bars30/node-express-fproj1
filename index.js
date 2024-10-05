require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

// Middleware to parse JSON bodies
app.use(express.json()); // Only keep this line
app.use(cors());
// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 70000
});
client.connect(err => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to database');
  }
});

// Middleware for logging
app.use((req, res, next) => {
  console.log('Headers:', req.headers); // Log request headers
  console.log('Raw body:', req.body); // Log request body
  next();
});

// Register endpoint
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);

//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const result = await client.query(
//       'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
//       [email, hashedPassword]
//     );

//     res.json({ userId: result.rows[0].id });
//   } catch (err) {
//     res.status(500).json({ error: 'Registration error', details: err.message });
//   }
// });
// ----
// Register endpoint
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Проверка, существует ли пользователь
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Вставка нового пользователя в базу данных
    const result = await client.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );

    const userId = result.rows[0].id;

    // Генерация JWT-токена
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Возвращаем токен вместе с id нового пользователя
    res.json({ userId, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration error', details: err.message });
  }
});
// noooo
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   console.log('Received registration request:', { email });
//   res.send(req.body)
//   if (!email || !password) {
//     console.log('Email or password missing');
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
//     console.log('Checked for existing user');
//     res.send('Checked for existing user')

//     if (existingUser.rows.length > 0) {
//       console.log('User already exists');
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     console.log('Password hashed');

//     const result = await client.query(
//       'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
//       [email, hashedPassword]
//     );

//     const userId = result.rows[0].id;
//     const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ userId, token });
//   } catch (err) {
//     console.error('Registration error:', err);
//     res.status(500).json({ error: 'Registration error', details: err.message });
//   }
// });


// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login error', details: err.message });
  }
});

// Data endpoint (protected by JWT)
app.post('/data', verifyToken, (req, res) => {
  const { input_data } = req.body;

  const result_data = `You entered: ${input_data}`;
  res.json({ result_data });
});


// Change Password endpoint
app.patch('/change-password', verifyToken, async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Email, old password, and new password are required' });
  }

  try {
    // Fetch the user's current password from the database
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    // Verify the old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error changing password', details: err.message });
  }
});

app.get('/get', (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (or specify a domain)
  res.send("yeh it's working");
});

// JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from 'Bearer <token>'

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.id;
    next();
  });
}

// Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


module.exports = app;