const fs = require('fs');

function writeTodoList(myData, callback) {
    const data = JSON.stringify(myData, null, 2);

    fs.writeFile('savedText.json', data, 'utf8', (err) =>{
        if (err) {
            console.error('Error writing file locally', err);
        }else{
            console.log('Done writing file');
        }
        if (callback) {
            callback();
        }
    })
}

const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests (express.json())
app.use(express.json());

// Sample data for tasks
let tasks = [
  { id: 1, title: 'Task 1', description: 'Description for Task 1' },
  { id: 2, title: 'Task 2', description: 'Description for Task 2' },
];
//Rate Limiter

const rateLimitMiddleware = (req, res, next) => {
  const IP = req.ip; // Get the client's IP address
  const MAX_REQUESTS = 5; // Adjust this to your desired limit
  const WINDOW_MS = 60000; // 1 minute window
  
  

  // Create or update an object to track request counts per IP
  if (!res.locals.rateLimit) {
    res.locals.rateLimit = {};
  }

  if (!res.locals.rateLimit[IP]) {
    res.locals.rateLimit[IP] = { count: 1, lastRequest: Date.now() };
  } else {
    const { count, lastRequest } = res.locals.rateLimit[IP];

    // Check if the client has exceeded the rate limit
    if (count >= MAX_REQUESTS && Date.now() - lastRequest < WINDOW_MS) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    // Reset the count if the window has passed
    if (Date.now() - lastRequest >= WINDOW_MS) {
      res.locals.rateLimit[IP] = { count: 1, lastRequest: Date.now() };
    } else {
      res.locals.rateLimit[IP].count++;
    }
  }

  // Continue to the next middleware or route handler
  next();
};


// Routes for CRUD operations

// Create a new task
app.post('/tasks', (req, res) => {
  const newTask = req.body;
  newTask.id = tasks.length + 1;
  tasks.push(newTask);
  writeTodoList(tasks)
  res.status(201).json(newTask);
});

// Read all tasks
app.get('/tasks', rateLimitMiddleware, (req, res) => {
  res.json(tasks);
});

// Read a specific task by ID
app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
  } else {
    res.json(task);
  }
});

// Update a task by ID
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const updatedTask = req.body;
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) {
    res.status(404).json({ message: 'Task not found' });
  } else {
    tasks[index] = { ...tasks[index], ...updatedTask };
    res.json(tasks[index]);
  }
});

// Delete a task by ID
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) {
    res.status(404).json({ message: 'Task not found' });
  } else {
    const deletedTask = tasks.splice(index, 1)[0];
    res.json(deletedTask);
    writeTodoList(tasks)
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
