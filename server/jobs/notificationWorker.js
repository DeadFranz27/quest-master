import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apnsService from '../services/apnsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SCHEDULED_NOTIFICATIONS_FILE = path.join(DATA_DIR, 'scheduled-notifications.json');

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

// Run every minute to check for pending notifications
cron.schedule('* * * * *', async () => {
  try {
    // Skip if APNs is not configured
    if (!apnsService.isConfigured()) {
      return;
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Get notifications to send (within next 5 minutes and not yet sent)
    const scheduledNotifications = readData(SCHEDULED_NOTIFICATIONS_FILE);
    const tasks = readData(TASKS_FILE);

    const notificationsToSend = scheduledNotifications.filter(n => {
      const scheduledTime = new Date(n.scheduledTime);
      return scheduledTime <= fiveMinutesFromNow && !n.sent;
    });

    if (notificationsToSend.length === 0) {
      return;
    }

    console.log(`📬 Processing ${notificationsToSend.length} pending notification(s)...`);

    for (const notification of notificationsToSend) {
      try {
        // Get task details
        const task = tasks.find(t => t._id === notification.taskId);

        if (!task) {
          console.log(`⚠️  Task ${notification.taskId} not found, marking notification as sent`);
          notification.sent = true;
          notification.sentAt = new Date().toISOString();
          continue;
        }

        // Skip if task is completed
        if (task.completed) {
          console.log(`⚠️  Task ${notification.taskId} is completed, skipping notification`);
          notification.sent = true;
          notification.sentAt = new Date().toISOString();
          continue;
        }

        // Calculate time until deadline
        const deadline = new Date(task.deadline);
        const timeUntilDeadline = Math.round((deadline - now) / 60000); // in minutes
        const advanceNotice = notification.advanceNotice || 30;

        // Build notification message
        let body;
        if (timeUntilDeadline <= 0) {
          body = `${task.icon || '📌'} ${task.text} is due now!`;
        } else if (timeUntilDeadline < 60) {
          body = `${task.icon || '📌'} ${task.text} is due in ${timeUntilDeadline} minute${timeUntilDeadline !== 1 ? 's' : ''}!`;
        } else {
          const hours = Math.round(timeUntilDeadline / 60);
          body = `${task.icon || '📌'} ${task.text} is due in ${hours} hour${hours !== 1 ? 's' : ''}!`;
        }

        // Send notification
        const result = await apnsService.sendNotification(
          notification.deviceToken,
          'Task Deadline Reminder',
          body,
          {
            taskId: notification.taskId,
            type: 'deadline',
            deadline: task.deadline
          }
        );

        // Mark as sent
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
        notification.result = {
          sent: result.sent?.length || 0,
          failed: result.failed?.length || 0
        };

        console.log(`✅ Sent notification ${notification.id} for task ${notification.taskId}`);
      } catch (error) {
        console.error(`❌ Failed to send notification ${notification.id}:`, error.message);
        // Mark as sent anyway to avoid retrying indefinitely
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
        notification.error = error.message;
      }
    }

    // Save updated notifications
    writeData(SCHEDULED_NOTIFICATIONS_FILE, scheduledNotifications);

    // Clean up old sent notifications (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const filteredNotifications = scheduledNotifications.filter(n => {
      if (!n.sent) return true; // Keep unsent notifications
      const sentAt = new Date(n.sentAt);
      return sentAt > sevenDaysAgo; // Keep recent sent notifications
    });

    if (filteredNotifications.length !== scheduledNotifications.length) {
      writeData(SCHEDULED_NOTIFICATIONS_FILE, filteredNotifications);
      console.log(`🗑️  Cleaned up ${scheduledNotifications.length - filteredNotifications.length} old notification(s)`);
    }
  } catch (error) {
    console.error('❌ Notification worker error:', error);
  }
});

console.log('📡 Notification worker started (runs every minute)');
