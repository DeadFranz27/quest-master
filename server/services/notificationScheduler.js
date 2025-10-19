import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const DEVICE_TOKENS_FILE = path.join(DATA_DIR, 'device-tokens.json');
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

export async function scheduleDeadlineNotification(taskId, userId) {
  try {
    // Get task details
    const tasks = readData(TASKS_FILE);
    const task = tasks.find(t => t._id === taskId && t.userId === userId);

    if (!task) {
      console.log(`⚠️  Task ${taskId} not found`);
      return;
    }

    if (!task.deadline || task.completed) {
      console.log(`⚠️  Task ${taskId} has no deadline or is completed`);
      return;
    }

    // Get user's notification settings
    const deviceTokens = readData(DEVICE_TOKENS_FILE);
    const userDevices = deviceTokens.filter(
      d => d.userId === userId && d.enabled && d.deadlineAlerts
    );

    if (userDevices.length === 0) {
      console.log(`⚠️  No enabled devices for user ${userId}`);
      return;
    }

    // Calculate notification time
    const deadline = new Date(task.deadline);
    const now = new Date();

    const scheduledNotifications = readData(SCHEDULED_NOTIFICATIONS_FILE);

    for (const device of userDevices) {
      const advanceNotice = device.advanceNotice || 30; // Default 30 minutes
      const notificationTime = new Date(deadline.getTime() - (advanceNotice * 60 * 1000));

      // Only schedule if notification time is in the future
      if (notificationTime > now) {
        // Check if notification already exists
        const existingNotification = scheduledNotifications.find(
          n => n.taskId === taskId &&
               n.userId === userId &&
               n.deviceToken === device.deviceToken &&
               !n.sent
        );

        if (!existingNotification) {
          // Create new scheduled notification
          scheduledNotifications.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            taskId,
            deviceToken: device.deviceToken,
            notificationType: 'deadline',
            scheduledTime: notificationTime.toISOString(),
            advanceNotice,
            sent: false,
            createdAt: new Date().toISOString()
          });

          console.log(`📅 Scheduled notification for task ${taskId} at ${notificationTime.toISOString()}`);
        }
      } else {
        console.log(`⚠️  Notification time ${notificationTime.toISOString()} is in the past, skipping`);
      }
    }

    writeData(SCHEDULED_NOTIFICATIONS_FILE, scheduledNotifications);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelTaskNotifications(taskId) {
  try {
    const scheduledNotifications = readData(SCHEDULED_NOTIFICATIONS_FILE);
    const filteredNotifications = scheduledNotifications.filter(
      n => !(n.taskId === taskId && !n.sent)
    );

    const removedCount = scheduledNotifications.length - filteredNotifications.length;

    if (removedCount > 0) {
      writeData(SCHEDULED_NOTIFICATIONS_FILE, filteredNotifications);
      console.log(`🗑️  Cancelled ${removedCount} notification(s) for task ${taskId}`);
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

export async function scheduleNotificationsForUser(userId) {
  try {
    const tasks = readData(TASKS_FILE);
    const userTasks = tasks.filter(
      t => t.userId === userId && !t.completed && t.deadline
    );

    console.log(`📋 Scheduling notifications for ${userTasks.length} tasks for user ${userId}`);

    for (const task of userTasks) {
      await scheduleDeadlineNotification(task._id, userId);
    }
  } catch (error) {
    console.error('Error scheduling notifications for user:', error);
  }
}
