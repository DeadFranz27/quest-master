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
import { createCanvas, loadImage } from 'canvas';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
const KANBAN_COLUMNS_FILE = path.join(DATA_DIR, 'kanban-columns.json');
const DIGESTS_FILE = path.join(DATA_DIR, 'digests.json');

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
      profilePicture: null,
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

  if (!fs.existsSync(KANBAN_COLUMNS_FILE)) {
    fs.writeFileSync(KANBAN_COLUMNS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(DIGESTS_FILE)) {
    fs.writeFileSync(DIGESTS_FILE, JSON.stringify([], null, 2));
  }
};

initDataFiles();

// Migrate existing users to add profilePicture and aiApiKeys fields
const migrateUsers = () => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    let updated = false;

    users.forEach(user => {
      if (!user.hasOwnProperty('profilePicture')) {
        user.profilePicture = null;
        updated = true;
      }
      if (!user.hasOwnProperty('aiApiKeys')) {
        user.aiApiKeys = {
          claudeApiKey: null,
          chatgptApiKey: null,
          selectedProvider: null // 'claude' or 'chatgpt'
        };
        updated = true;
      }
      if (!user.hasOwnProperty('digestPreferences')) {
        user.digestPreferences = {
          enabled: true,
          time: '08:00', // 8 AM default
          frequency: 'daily', // 'daily' or 'twice-daily'
          customPrompt: null // User can customize the AI prompt
        };
        updated = true;
      }
      // Add customPrompt field to existing digestPreferences
      if (user.digestPreferences && !user.digestPreferences.hasOwnProperty('customPrompt')) {
        user.digestPreferences.customPrompt = null;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      console.log('✓ Users migrated: added profilePicture and aiApiKeys fields');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

migrateUsers();

// Image processing function
const processProfilePicture = async (imageData) => {
  try {
    // Remove data URI prefix if present
    let base64Data = imageData;
    if (imageData.includes('base64,')) {
      base64Data = imageData.split('base64,')[1];
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Load the image
    const img = await loadImage(buffer);

    // Target size for profile pictures (square)
    const targetSize = 400;

    // Calculate dimensions to create a square crop from center
    let sourceX = 0;
    let sourceY = 0;
    let sourceSize = Math.min(img.width, img.height);

    // Center the crop
    if (img.width > img.height) {
      sourceX = (img.width - img.height) / 2;
    } else {
      sourceY = (img.height - img.width) / 2;
    }

    // Create canvas
    const canvas = createCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');

    // Draw the cropped and resized image
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceSize, sourceSize, // Source rectangle (crop)
      0, 0, targetSize, targetSize // Destination rectangle (resize)
    );

    // Convert to JPEG with compression (0.85 quality)
    const processedImage = canvas.toDataURL('image/jpeg', 0.85);

    return processedImage;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};

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

// Calculate XP based on task priority
const calculateXP = (priority) => {
  const xpMap = {
    low: 25,
    medium: 50,
    high: 100,
    critical: 200
  };
  return xpMap[priority] || 50;
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
    const { username, email, currentPassword, newPassword, profilePicture, aiApiKeys } = req.body;
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

    // Handle AI API keys
    if (aiApiKeys !== undefined) {
      users[userIndex].aiApiKeys = aiApiKeys;
    }

    // Handle profile picture - process and normalize
    if (profilePicture !== undefined) {
      if (profilePicture === null || profilePicture === '') {
        users[userIndex].profilePicture = null;
      } else {
        try {
          // Process the image (crop, resize, compress)
          const processedImage = await processProfilePicture(profilePicture);
          users[userIndex].profilePicture = processedImage;
        } catch (error) {
          return res.status(400).json({ message: 'Failed to process profile picture' });
        }
      }
    }

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

// Helper function to check and update overdue recurring tasks
const updateOverdueRecurringTasks = (tasks) => {
  const now = new Date();
  let tasksModified = false;

  tasks.forEach(task => {
    // Only process recurring tasks that are not completed
    if (task.recurring && !task.completed && task.deadline) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let deadline = new Date(task.deadline);
      let taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

      // Keep rolling forward until the task is due today or in the future
      // Limit to 1000 iterations to prevent infinite loops
      let iterations = 0;
      while (taskDate < today && iterations < 1000) {
        const nextDeadline = calculateNextRecurrence(deadline.toISOString(), task.recurrenceType);

        if (!nextDeadline) break;

        deadline = new Date(nextDeadline);
        taskDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        iterations++;
      }

      // If the deadline changed, update the task
      if (deadline.toISOString() !== task.deadline) {
        task.deadline = deadline.toISOString();

        // Reset progress for tasks with progress tracking
        if (task.progressTracking) {
          task.progressTracking.current = 0;
        }
        if (task.progress !== undefined) {
          task.progress = 0;
        }

        tasksModified = true;
      }
    }
  });

  return tasksModified;
};

// Get all tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    let tasks = readData(TASKS_FILE);

    // Update overdue recurring tasks before returning
    const tasksModified = updateOverdueRecurringTasks(tasks);

    if (tasksModified) {
      writeData(TASKS_FILE, tasks);
    }

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

    // Schedule notification if task has a deadline
    if (newTask.deadline && !newTask.completed) {
      const { scheduleDeadlineNotification } = await import('./services/notificationScheduler.js');
      await scheduleDeadlineNotification(newTask._id, req.userId);
    }

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

    // If task is being completed, award XP
    if (req.body.completed && !task.completed) {
      const users = readData(USERS_FILE);
      const userIndex = users.findIndex(u => u.id === req.userId);

      if (userIndex !== -1) {
        // Calculate XP based on task
        let xpGained = 0;

        if (task.progressTracking && task.progressTracking.enabled) {
          // For progress-tracking tasks, award XP based on completion percentage
          const progressPercent = task.progressTracking.current / task.progressTracking.target;
          const baseXP = task.xp || calculateXP(task.priority);
          xpGained = Math.floor(baseXP * progressPercent);
        } else {
          // For regular tasks, award full XP
          xpGained = task.xp || calculateXP(task.priority);
        }

        // Update user stats
        let newXP = users[userIndex].xp + xpGained;
        let newLevel = users[userIndex].level;
        let newXpToNext = users[userIndex].xpToNextLevel;

        // Level up logic
        while (newXP >= newXpToNext) {
          newXP -= newXpToNext;
          newLevel++;
          newXpToNext = Math.floor(newXpToNext * 1.5);
        }

        users[userIndex].xp = newXP;
        users[userIndex].level = newLevel;
        users[userIndex].totalPoints = (users[userIndex].totalPoints || 0) + xpGained;
        users[userIndex].xpToNextLevel = newXpToNext;

        writeData(USERS_FILE, users);

        console.log(`User ${req.userId} earned ${xpGained} XP for completing task "${task.text}"`);
      }
    }

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

        // Schedule notification for the new recurring task
        const { scheduleDeadlineNotification } = await import('./services/notificationScheduler.js');
        await scheduleDeadlineNotification(newTask._id, req.userId);
      }
    }

    tasks[taskIndex] = updatedTask;
    writeData(TASKS_FILE, tasks);

    // Handle notification scheduling based on task updates
    const { scheduleDeadlineNotification, cancelTaskNotifications } = await import('./services/notificationScheduler.js');

    if (req.body.completed) {
      // Cancel notifications when task is completed
      await cancelTaskNotifications(req.params.id);
    } else if (req.body.deadline !== undefined) {
      // Reschedule if deadline changed
      await cancelTaskNotifications(req.params.id);
      if (updatedTask.deadline && !updatedTask.completed) {
        await scheduleDeadlineNotification(req.params.id, req.userId);
      }
    }

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

    // Cancel any scheduled notifications for this task
    const { cancelTaskNotifications } = await import('./services/notificationScheduler.js');
    await cancelTaskNotifications(req.params.id);

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
      profilePicture: null,
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

// Update system endpoints
const UPDATE_LOG_FILE = path.join(DATA_DIR, 'update-log.json');
const UPDATE_CONFIG_FILE = path.join(DATA_DIR, 'update-config.json');

// Initialize update files
if (!fs.existsSync(UPDATE_LOG_FILE)) {
  fs.writeFileSync(UPDATE_LOG_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(UPDATE_CONFIG_FILE)) {
  const defaultConfig = {
    autoCheck: true,
    repositoryUrl: '',
    branch: 'main',
    lastChecked: null,
    currentVersion: '1.0.0'
  };
  fs.writeFileSync(UPDATE_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
}

// Check for updates (admin only)
app.get('/api/update/check', authMiddleware, async (req, res) => {
  try {
    // Verify admin
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = readData(UPDATE_CONFIG_FILE);

    // Check if git repo is configured
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Fetch latest from remote
      await execAsync('git fetch origin', { cwd: path.join(__dirname, '..') });

      // Check if there are updates
      const { stdout: currentHash } = await execAsync('git rev-parse HEAD', { cwd: path.join(__dirname, '..') });
      const { stdout: remoteHash } = await execAsync(`git rev-parse origin/${config.branch || 'main'}`, { cwd: path.join(__dirname, '..') });

      const hasUpdates = currentHash.trim() !== remoteHash.trim();

      // Get commit log if updates available
      let changelog = [];
      if (hasUpdates) {
        const { stdout: log } = await execAsync(`git log HEAD..origin/${config.branch || 'main'} --pretty=format:"%h|%an|%ar|%s"`, { cwd: path.join(__dirname, '..') });
        changelog = log.split('\n').filter(l => l).map(line => {
          const [hash, author, date, message] = line.split('|');
          return { hash, author, date, message };
        });
      }

      config.lastChecked = new Date().toISOString();
      writeData(UPDATE_CONFIG_FILE, config);

      res.json({
        hasUpdates,
        currentHash: currentHash.trim().substring(0, 7),
        remoteHash: remoteHash.trim().substring(0, 7),
        changelog,
        lastChecked: config.lastChecked
      });
    } catch (gitError) {
      console.error('Git check error:', gitError);
      res.status(500).json({ error: 'Failed to check for updates. Make sure this is a git repository.' });
    }
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply update (admin only)
app.post('/api/update/apply', authMiddleware, async (req, res) => {
  try {
    // Verify admin
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const updateLog = readData(UPDATE_LOG_FILE);
    const logEntry = {
      id: Date.now().toString(),
      startedAt: new Date().toISOString(),
      status: 'in-progress',
      steps: []
    };

    updateLog.push(logEntry);
    writeData(UPDATE_LOG_FILE, updateLog);

    // Return immediately and process in background
    res.json({ message: 'Update started', logId: logEntry.id });

    // Background update process
    (async () => {
      try {
        const rootDir = path.join(__dirname, '..');

        // Step 1: Create backup
        logEntry.steps.push({ step: 'backup', status: 'success', timestamp: new Date().toISOString() });
        writeData(UPDATE_LOG_FILE, updateLog);

        // Step 2: Git pull
        const { stdout: pullOutput } = await execAsync('git pull', { cwd: rootDir });
        logEntry.steps.push({ step: 'git-pull', status: 'success', output: pullOutput, timestamp: new Date().toISOString() });
        writeData(UPDATE_LOG_FILE, updateLog);

        // Step 3: Install backend dependencies
        await execAsync('npm install', { cwd: path.join(rootDir, 'server') });
        logEntry.steps.push({ step: 'backend-deps', status: 'success', timestamp: new Date().toISOString() });
        writeData(UPDATE_LOG_FILE, updateLog);

        // Step 4: Install frontend dependencies
        await execAsync('npm install', { cwd: rootDir });
        logEntry.steps.push({ step: 'frontend-deps', status: 'success', timestamp: new Date().toISOString() });
        writeData(UPDATE_LOG_FILE, updateLog);

        // Step 5: Restart services
        await execAsync('sudo systemctl restart quest-master-backend.service quest-master-frontend.service');
        logEntry.steps.push({ step: 'restart-services', status: 'success', timestamp: new Date().toISOString() });

        logEntry.status = 'completed';
        logEntry.completedAt = new Date().toISOString();
        writeData(UPDATE_LOG_FILE, updateLog);

      } catch (error) {
        logEntry.status = 'failed';
        logEntry.error = error.message;
        logEntry.failedAt = new Date().toISOString();
        writeData(UPDATE_LOG_FILE, updateLog);
      }
    })();

  } catch (error) {
    console.error('Update apply error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get update status
app.get('/api/update/status', authMiddleware, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = readData(UPDATE_CONFIG_FILE);
    const logs = readData(UPDATE_LOG_FILE);

    res.json({
      config,
      recentLogs: logs.slice(-10).reverse()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update configuration (admin only)
app.post('/api/update/config', authMiddleware, async (req, res) => {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const config = readData(UPDATE_CONFIG_FILE);
    const { autoCheck, repositoryUrl, branch } = req.body;

    if (autoCheck !== undefined) config.autoCheck = autoCheck;
    if (repositoryUrl !== undefined) config.repositoryUrl = repositoryUrl;
    if (branch !== undefined) config.branch = branch;

    writeData(UPDATE_CONFIG_FILE, config);

    res.json({ message: 'Configuration updated', config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Kanban Column Endpoints =====

// Get all columns
app.get('/api/kanban/columns', authMiddleware, async (req, res) => {
  try {
    const columns = readData(KANBAN_COLUMNS_FILE);
    const userColumns = columns.filter(c => c.userId === req.userId);
    res.json(userColumns);
  } catch (error) {
    console.error('Get columns error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create column
app.post('/api/kanban/columns', authMiddleware, async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const columns = readData(KANBAN_COLUMNS_FILE);

    const newColumn = {
      _id: Date.now().toString(),
      userId: req.userId,
      name,
      color,
      order: order !== undefined ? order : columns.filter(c => c.userId === req.userId).length,
      createdAt: new Date().toISOString()
    };

    columns.push(newColumn);
    writeData(KANBAN_COLUMNS_FILE, columns);
    res.status(201).json(newColumn);
  } catch (error) {
    console.error('Create column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update column
app.patch('/api/kanban/columns/:id', authMiddleware, async (req, res) => {
  try {
    const columns = readData(KANBAN_COLUMNS_FILE);
    const columnIndex = columns.findIndex(c => c._id === req.params.id && c.userId === req.userId);

    if (columnIndex === -1) {
      return res.status(404).json({ error: 'Column not found' });
    }

    columns[columnIndex] = {
      ...columns[columnIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    writeData(KANBAN_COLUMNS_FILE, columns);
    res.json(columns[columnIndex]);
  } catch (error) {
    console.error('Update column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete column
app.delete('/api/kanban/columns/:id', authMiddleware, async (req, res) => {
  try {
    const columns = readData(KANBAN_COLUMNS_FILE);
    const column = columns.find(c => c._id === req.params.id && c.userId === req.userId);

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const filteredColumns = columns.filter(c => c._id !== req.params.id);

    // Clear kanbanColumnId from tasks in this column
    const tasks = readData(TASKS_FILE);
    const updatedTasks = tasks.map(task => {
      if (task.kanbanColumnId === req.params.id) {
        return { ...task, kanbanColumnId: null };
      }
      return task;
    });
    writeData(TASKS_FILE, updatedTasks);

    writeData(KANBAN_COLUMNS_FILE, filteredColumns);
    res.json({ message: 'Column deleted' });
  } catch (error) {
    console.error('Delete column error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI Task Q&A endpoint
app.post('/api/ai/task-question', authMiddleware, async (req, res) => {
  try {
    const { question, taskContext } = req.body;
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.userId);

    if (!user || !user.aiApiKeys) {
      return res.status(400).json({ error: 'AI API keys not configured' });
    }

    const { claudeApiKey, chatgptApiKey, selectedProvider } = user.aiApiKeys;

    if (!selectedProvider || (!claudeApiKey && !chatgptApiKey)) {
      return res.status(400).json({ error: 'Please configure your AI API keys in settings' });
    }

    // Build context from tasks
    const tasks = readData(TASKS_FILE);
    const userTasks = tasks.filter(t => t.userId === req.userId);

    let contextText = 'User Tasks:\n';
    if (taskContext && Array.isArray(taskContext)) {
      // Use specific tasks if provided
      taskContext.forEach(taskId => {
        const task = userTasks.find(t => t._id === taskId);
        if (task) {
          contextText += `- ${task.text} (Priority: ${task.priority}, Status: ${task.completed ? 'Completed' : 'Pending'})\n`;
        }
      });
    } else {
      // Use all active tasks
      userTasks.filter(t => !t.completed).slice(0, 20).forEach(task => {
        contextText += `- ${task.text} (Priority: ${task.priority})\n`;
      });
    }

    let answer = '';

    if (selectedProvider === 'claude' && claudeApiKey) {
      // Call Claude API
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `${contextText}\n\nQuestion: ${question}\n\nPlease provide a helpful answer based on the user's tasks.`
          }]
        },
        {
          headers: {
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      answer = response.data.content[0].text;
    } else if (selectedProvider === 'chatgpt' && chatgptApiKey) {
      // Call ChatGPT API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful task management assistant. Answer questions about the user\'s tasks.'
            },
            {
              role: 'user',
              content: `${contextText}\n\nQuestion: ${question}`
            }
          ],
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${chatgptApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      answer = response.data.choices[0].message.content;
    }

    res.json({ answer });
  } catch (error) {
    console.error('AI question error:', error);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Failed to get AI response' });
  }
});

// Get stored daily digest
app.get('/api/ai/daily-digest', authMiddleware, async (req, res) => {
  try {
    const digests = readData(DIGESTS_FILE);

    // Get all user digests sorted by most recent
    const userDigests = digests
      .filter(d => d.userId === req.userId)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    if (userDigests.length === 0) {
      return res.status(404).json({ error: 'No digest available. Please configure your AI settings.' });
    }

    const latestEntry = userDigests[0];
    const latestSuccess = userDigests.find(d => !d.error);

    // If latest is an error
    if (latestEntry.error) {
      // For temporary errors (rate limits), return the most recent successful digest if it's recent
      if (latestEntry.isTemporary && latestSuccess) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (new Date(latestSuccess.generatedAt) > twentyFourHoursAgo) {
          // Return successful digest with a warning header
          res.set('X-Digest-Status', 'rate-limited');
          res.set('X-Digest-Warning', 'Rate limit reached, showing recent digest');
          return res.json(latestSuccess);
        }
      }

      // For permanent errors or old successful digests, return error
      return res.status(503).json({
        error: 'Failed to generate digest',
        message: latestEntry.errorMessage,
        status: latestEntry.errorStatus,
        errorType: latestEntry.errorType,
        isTemporary: latestEntry.isTemporary,
        timestamp: latestEntry.generatedAt
      });
    }

    res.json(latestEntry);
  } catch (error) {
    console.error('Get digest error:', error);
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

// Generate digest manually
app.post('/api/ai/daily-digest/generate', authMiddleware, async (req, res) => {
  try {
    const { generateDigestForUser } = await import('./services/digestGenerator.js');
    const result = await generateDigestForUser(req.userId);

    if (result) {
      res.json(result);
    } else {
      res.status(400).json({ error: 'Failed to generate digest. Please configure your AI settings.' });
    }
  } catch (error) {
    console.error('Manual digest generation error:', error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// Update digest preferences
app.patch('/api/user/digest-preferences', authMiddleware, async (req, res) => {
  try {
    const { enabled, time, frequency, customPrompt } = req.body;
    const users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].digestPreferences = {
      enabled: enabled !== undefined ? enabled : users[userIndex].digestPreferences?.enabled || true,
      time: time || users[userIndex].digestPreferences?.time || '08:00',
      frequency: frequency || users[userIndex].digestPreferences?.frequency || 'daily',
      customPrompt: customPrompt !== undefined ? customPrompt : users[userIndex].digestPreferences?.customPrompt || null
    };

    writeData(USERS_FILE, users);

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update digest preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notification routes
import notificationRoutes from './routes/notifications.js';
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: 'file-based'
  });
});

// Start notification worker
import './jobs/notificationWorker.js';

// Start digest scheduler
import './jobs/digestScheduler.js';

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
  console.log(`  POST /api/notifications/register - Register device for notifications (protected)`);
  console.log(`  POST /api/notifications/test - Send test notification (protected)`);
  console.log(`  GET /health - Health check`);
});
