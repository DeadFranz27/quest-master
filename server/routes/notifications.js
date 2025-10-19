import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apnsService from '../services/apnsService.js';
import { scheduleNotificationsForUser } from '../services/notificationScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const DEVICE_TOKENS_FILE = path.join(DATA_DIR, 'device-tokens.json');

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

// POST /api/notifications/register
// Register a device token with notification settings
router.post('/register', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { deviceToken, platform, settings } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const deviceTokens = readData(DEVICE_TOKENS_FILE);

    // Check if device token already exists
    const existingIndex = deviceTokens.findIndex(
      d => d.deviceToken === deviceToken
    );

    const deviceData = {
      userId,
      deviceToken,
      platform: platform || 'ios',
      enabled: settings?.enabled !== undefined ? settings.enabled : true,
      deadlineAlerts: settings?.deadlineAlerts !== undefined ? settings.deadlineAlerts : true,
      taskReminders: settings?.taskReminders !== undefined ? settings.taskReminders : true,
      dailyDigest: settings?.dailyDigest !== undefined ? settings.dailyDigest : false,
      advanceNotice: settings?.advanceNotice || 30,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing device token
      deviceTokens[existingIndex] = {
        ...deviceTokens[existingIndex],
        ...deviceData
      };
    } else {
      // Add new device token
      deviceTokens.push({
        id: Date.now().toString(),
        ...deviceData,
        createdAt: new Date().toISOString()
      });
    }

    writeData(DEVICE_TOKENS_FILE, deviceTokens);

    // Schedule notifications for existing tasks
    await scheduleNotificationsForUser(userId);

    console.log(`✅ Device registered for user ${userId}: ${deviceToken.substring(0, 10)}...`);
    res.json({ success: true, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// DELETE /api/notifications/unregister
// Unregister a device token
router.delete('/unregister', async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const deviceTokens = readData(DEVICE_TOKENS_FILE);
    const filteredTokens = deviceTokens.filter(d => d.deviceToken !== deviceToken);

    if (deviceTokens.length === filteredTokens.length) {
      return res.status(404).json({ error: 'Device token not found' });
    }

    writeData(DEVICE_TOKENS_FILE, filteredTokens);

    console.log(`✅ Device unregistered: ${deviceToken.substring(0, 10)}...`);
    res.json({ success: true, message: 'Device unregistered' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

// GET /api/notifications/settings
// Get notification settings for current user
router.get('/settings', async (req, res) => {
  try {
    const userId = req.userId;
    const deviceTokens = readData(DEVICE_TOKENS_FILE);
    const userDevices = deviceTokens.filter(d => d.userId === userId);

    res.json({ devices: userDevices });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// PATCH /api/notifications/settings/:deviceToken
// Update notification settings for a specific device
router.patch('/settings/:deviceToken', async (req, res) => {
  try {
    const userId = req.userId;
    const { deviceToken } = req.params;
    const settings = req.body;

    const deviceTokens = readData(DEVICE_TOKENS_FILE);
    const deviceIndex = deviceTokens.findIndex(
      d => d.deviceToken === deviceToken && d.userId === userId
    );

    if (deviceIndex === -1) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update settings
    deviceTokens[deviceIndex] = {
      ...deviceTokens[deviceIndex],
      ...settings,
      updatedAt: new Date().toISOString()
    };

    writeData(DEVICE_TOKENS_FILE, deviceTokens);

    // Reschedule notifications if settings changed
    if (settings.deadlineAlerts !== undefined || settings.advanceNotice !== undefined) {
      await scheduleNotificationsForUser(userId);
    }

    res.json({ success: true, device: deviceTokens[deviceIndex] });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/notifications/test
// Send a test notification immediately
router.post('/test', async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!apnsService.isConfigured()) {
      return res.status(503).json({
        error: 'APNs is not configured. Set APNS_KEY_PATH, APNS_KEY_ID, and APNS_TEAM_ID in .env'
      });
    }

    // Get user's device tokens
    const deviceTokens = readData(DEVICE_TOKENS_FILE);
    const userDevices = deviceTokens.filter(
      d => d.userId === userId && d.enabled
    );

    if (userDevices.length === 0) {
      return res.status(404).json({ error: 'No registered devices found' });
    }

    // Send to all devices
    const results = [];
    for (const device of userDevices) {
      try {
        const result = await apnsService.sendNotification(
          device.deviceToken,
          'Test Notification',
          message || 'Quest Master notifications are working! 🎉',
          { type: 'test' }
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to send to ${device.deviceToken}:`, error);
      }
    }

    res.json({ success: true, sent: userDevices.length, results });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
