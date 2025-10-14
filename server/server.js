import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuration
const HOME_ASSISTANT_URL = process.env.HA_URL || 'http://homeassistant.local:8123';
const HOME_ASSISTANT_TOKEN = process.env.HA_TOKEN || 'YOUR_LONG_LIVED_ACCESS_TOKEN';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// File-based storage
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const ROUTINES_FILE = path.join(DATA_DIR, 'routines.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
const initDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    // Create test user: username=admin, password=admin123
    const testUser = {
      id: '1',
      username: 'admin',
      email: 'admin@localhost',
      password: bcrypt.hashSync('admin123', 10),
      isAdmin: true,
      level: 1,
      xp: 0,
      totalPoints: 0,
      xpToNextLevel: 100,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([testUser], null, 2));
  }

  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(CATEGORIES_FILE)) {
    const defaultCategories = [
      { id: '1', userId: '1', name: 'Work', color: '#3b82f6', icon: '💼' },
      { id: '2', userId: '1', name: 'Personal', color: '#10b981', icon: '🏠' },
      { id: '3', userId: '1', name: 'Health', color: '#ef4444', icon: '❤️' },
      { id: '4', userId: '1', name: 'Learning', color: '#f59e0b', icon: '📚' }
    ];
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2));
  }

  if (!fs.existsSync(ROUTINES_FILE)) {
    fs.writeFileSync(ROUTINES_FILE, JSON.stringify([], null, 2));
  }
};

initDataFiles();

// Helper functions to read/write data
const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    return [];
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint (no registration for home use)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = readData(USERS_FILE);
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        userId: user.id
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        level: user.level,
        xp: user.xp,
        totalPoints: user.totalPoints,
        xpToNextLevel: user.xpToNextLevel,
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.patch('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, users[userIndex].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      users[userIndex].password = await bcrypt.hash(newPassword, 10);
    }

    // Update username and email
    if (username) users[userIndex].username = username;
    if (email !== undefined) users[userIndex].email = email;

    writeData(USERS_FILE, users);

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user stats
app.patch('/api/user/stats', authMiddleware, async (req, res) => {
  try {
    const { level, xp, totalPoints, xpToNextLevel } = req.body;
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex] = {
      ...users[userIndex],
      level,
      xp,
      totalPoints,
      xpToNextLevel
    };

    writeData(USERS_FILE, users);

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2FA: Setup - Generate secret and QR code
app.post('/api/user/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `QuestMaster (${user.username})`,
      issuer: 'QuestMaster'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2FA: Enable - Verify token and save secret
app.post('/api/user/2fa/enable', authMiddleware, async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ error: 'Secret and token are required' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Save secret and enable 2FA
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].twoFactorSecret = secret;
    users[userIndex].twoFactorEnabled = true;

    writeData(USERS_FILE, users);

    const { password, twoFactorSecret, ...userWithoutSensitiveData } = users[userIndex];
    res.json(userWithoutSensitiveData);
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2FA: Disable
app.post('/api/user/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, users[userIndex].password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    users[userIndex].twoFactorSecret = null;
    users[userIndex].twoFactorEnabled = false;

    writeData(USERS_FILE, users);

    const { password: _, twoFactorSecret, ...userWithoutSensitiveData } = users[userIndex];
    res.json(userWithoutSensitiveData);
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2FA: Verify token during login
app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and token are required' });
    }

    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled for this user' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        level: user.level,
        xp: user.xp,
        totalPoints: user.totalPoints,
        xpToNextLevel: user.xpToNextLevel,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = readData(TASKS_FILE);
    const userTasks = tasks.filter(t => t.userId === req.userId);
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = readData(TASKS_FILE);
    const newTask = {
      _id: Date.now().toString(),
      userId: req.userId,
      parentId: req.body.parentId || null,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    writeData(TASKS_FILE, tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate next recurrence date
const calculateNextRecurrence = (lastDate, recurrenceType) => {
  const date = new Date(lastDate);

  switch (recurrenceType) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return date.toISOString();
};

// Update task
app.patch('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const tasks = readData(TASKS_FILE);
    const taskIndex = tasks.findIndex(t => t._id === req.params.id && t.userId === req.userId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[taskIndex];

    // Handle nested field updates (like progressTracking.current)
    const updatedTask = { ...task };
    Object.keys(req.body).forEach(key => {
      if (key.includes('.')) {
        // Handle nested properties like "progressTracking.current"
        const parts = key.split('.');
        let current = updatedTask;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = req.body[key];
      } else {
        updatedTask[key] = req.body[key];
      }
    });

    // If task is being completed and it's recurring, create next occurrence
    if (req.body.completed && !task.completed && task.recurring) {
      const nextDeadline = calculateNextRecurrence(task.deadline || new Date().toISOString(), task.recurrenceType);

      if (nextDeadline) {
        const newTask = {
          _id: Date.now().toString(),
          userId: task.userId,
          text: task.text,
          priority: task.priority,
          icon: task.icon,
          category: task.category,
          categoryColor: task.categoryColor,
          deadline: nextDeadline,
          recurring: task.recurring,
          recurrenceType: task.recurrenceType,
          progress: 0,
          completed: false,
          createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
      }
    }

    tasks[taskIndex] = updatedTask;
    writeData(TASKS_FILE, tasks);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const tasks = readData(TASKS_FILE);
    const filteredTasks = tasks.filter(t => !(t._id === req.params.id && t.userId === req.userId));

    if (tasks.length === filteredTasks.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    writeData(TASKS_FILE, filteredTasks);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get categories
app.get('/api/categories', authMiddleware, async (req, res) => {
  try {
    const categories = readData(CATEGORIES_FILE);
    const userCategories = categories.filter(c => c.userId === req.userId);
    res.json(userCategories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category
app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const categories = readData(CATEGORIES_FILE);
    const newCategory = {
      _id: Date.now().toString(),
      userId: req.userId,
      ...req.body
    };
    categories.push(newCategory);
    writeData(CATEGORIES_FILE, categories);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category
app.patch('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const categories = readData(CATEGORIES_FILE);
    const categoryIndex = categories.findIndex(c => (c._id === req.params.id || c.id === req.params.id) && c.userId === req.userId);

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const oldCategoryName = categories[categoryIndex].name;
    const newCategoryName = req.body.name;

    // Update the category
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...req.body
    };

    writeData(CATEGORIES_FILE, categories);

    // If the category name changed, update all tasks that use this category
    if (newCategoryName && oldCategoryName !== newCategoryName) {
      const tasks = readData(TASKS_FILE);
      let tasksUpdated = false;

      tasks.forEach(task => {
        if (task.userId === req.userId && task.category === oldCategoryName) {
          task.category = newCategoryName;
          // Also update color if provided
          if (req.body.color) {
            task.categoryColor = req.body.color;
          }
          tasksUpdated = true;
        }
      });

      if (tasksUpdated) {
        writeData(TASKS_FILE, tasks);
      }
    }

    res.json(categories[categoryIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category
app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const categories = readData(CATEGORIES_FILE);
    const filteredCategories = categories.filter(c => !((c._id === req.params.id || c.id === req.params.id) && c.userId === req.userId));

    if (categories.length === filteredCategories.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    writeData(CATEGORIES_FILE, filteredCategories);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Routines API =====

// Get all routines
app.get('/api/routines', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const userRoutines = routines.filter(r => r.userId === req.userId);
    res.json(userRoutines);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create routine
app.post('/api/routines', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const newRoutine = {
      _id: Date.now().toString(),
      userId: req.userId,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    routines.push(newRoutine);
    writeData(ROUTINES_FILE, routines);
    res.status(201).json(newRoutine);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update routine
app.patch('/api/routines/:id', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const routineIndex = routines.findIndex(r => r._id === req.params.id && r.userId === req.userId);

    if (routineIndex === -1) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    routines[routineIndex] = {
      ...routines[routineIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    writeData(ROUTINES_FILE, routines);
    res.json(routines[routineIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete routine
app.delete('/api/routines/:id', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const filteredRoutines = routines.filter(r => !(r._id === req.params.id && r.userId === req.userId));

    if (routines.length === filteredRoutines.length) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    writeData(ROUTINES_FILE, filteredRoutines);
    res.json({ message: 'Routine deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete routine task
app.patch('/api/routines/:id/complete/:taskIndex', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const routineIndex = routines.findIndex(r => r._id === req.params.id && r.userId === req.userId);

    if (routineIndex === -1) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    const taskIndex = parseInt(req.params.taskIndex);
    if (taskIndex < 0 || taskIndex >= routines[routineIndex].tasks.length) {
      return res.status(400).json({ error: 'Invalid task index' });
    }

    routines[routineIndex].tasks[taskIndex].completed = true;
    routines[routineIndex].updatedAt = new Date().toISOString();

    writeData(ROUTINES_FILE, routines);
    res.json(routines[routineIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset routine (uncomplete all tasks)
app.patch('/api/routines/:id/reset', authMiddleware, async (req, res) => {
  try {
    const routines = readData(ROUTINES_FILE);
    const routineIndex = routines.findIndex(r => r._id === req.params.id && r.userId === req.userId);

    if (routineIndex === -1) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    routines[routineIndex].tasks.forEach(task => {
      task.completed = false;
    });
    routines[routineIndex].updatedAt = new Date().toISOString();

    writeData(ROUTINES_FILE, routines);
    res.json(routines[routineIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Device entity mapping
const DEVICE_ENTITY_MAP = {
  'playstation': 'switch.playstation',
  'xbox': 'switch.xbox',
  'tv': 'switch.tv',
  'computer': 'switch.computer',
  'tablet': 'switch.tablet'
};

// Helper function to call Home Assistant API
async function callHomeAssistant(entityId, service, domain = 'switch') {
  try {
    const response = await axios.post(
      `${HOME_ASSISTANT_URL}/api/services/${domain}/${service}`,
      { entity_id: entityId },
      {
        headers: {
          'Authorization': `Bearer ${HOME_ASSISTANT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error calling Home Assistant: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Block devices endpoint
app.post('/api/block-devices', async (req, res) => {
  const { devices } = req.body;

  if (!Array.isArray(devices)) {
    return res.status(400).json({ error: 'devices must be an array' });
  }

  console.log(`Blocking devices: ${devices.join(', ')}`);

  const results = [];
  for (const device of devices) {
    const entityId = DEVICE_ENTITY_MAP[device];
    if (entityId) {
      const result = await callHomeAssistant(entityId, 'turn_off');
      results.push({ device, entityId, ...result });
    } else {
      results.push({ device, error: 'Device not mapped to Home Assistant entity' });
    }
  }

  res.json({ message: 'Devices blocked', results });
});

// Unblock device endpoint
app.post('/api/unblock-device', async (req, res) => {
  const { device } = req.body;

  if (!device) {
    return res.status(400).json({ error: 'device is required' });
  }

  console.log(`Unblocking device: ${device}`);

  const entityId = DEVICE_ENTITY_MAP[device];

  if (entityId) {
    const result = await callHomeAssistant(entityId, 'turn_on');
    res.json({ message: 'Device unblocked', device, entityId, ...result });
  } else {
    res.json({
      message: 'Device unblocked from list',
      device,
      error: 'Device not mapped to Home Assistant entity'
    });
  }
});

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Admin: Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create user
app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const users = readData(USERS_FILE);

    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email: email || '',
      password: await bcrypt.hash(password, 10),
      isAdmin: isAdmin || false,
      level: 1,
      xp: 0,
      totalPoints: 0,
      xpToNextLevel: 100,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const users = readData(USERS_FILE);

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    users.splice(userIndex, 1);
    writeData(USERS_FILE, users);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: 'file-based'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✓ Quest Master Server running on http://localhost:${PORT}`);
  console.log(`✓ Network: http://192.168.27.182:${PORT}`);
  console.log(`✓ Storage: File-based (${DATA_DIR})`);
  console.log(`✓ Test User: username=admin, password=admin123`);
  console.log(`✓ Home Assistant URL: ${HOME_ASSISTANT_URL}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/auth/login - Login user`);
  console.log(`  GET /api/user/profile - Get user profile (protected)`);
  console.log(`  GET /api/tasks - Get all tasks (protected)`);
  console.log(`  POST /api/tasks - Create task (protected)`);
  console.log(`  GET /api/categories - Get categories (protected)`);
  console.log(`  POST /api/block-devices - Block devices`);
  console.log(`  POST /api/unblock-device - Unblock a device`);
  console.log(`  GET /health - Health check`);
});
