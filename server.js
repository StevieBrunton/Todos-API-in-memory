// server.js
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Set up SQLite database
const js = new sqlite3.Database('todos.js', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    js.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        priority TEXT DEFAULT 'low',
        isComplete BOOLEAN DEFAULT 0,
        isFun BOOLEAN DEFAULT 1
      )
    `);
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todos
app.get('/todos', (req, res) => {
  js.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

// GET a specific todo by ID
app.get('/todos/:id', (req, res) => {
  const id = req.params.id;
  js.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// POST a new todo
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = true } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  js.run(
    `INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, ?, ?)`,
    [name, priority, 0, isFun === 'true' || isFun === true],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        priority,
        isComplete: false,
        isFun: isFun === 'true' || isFun === true,
      });
    }
  );
});

// DELETE a todo by ID
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;
  js.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (this.changes > 0) {
      res.json({ message: `Todo item ${id} deleted.` });
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});