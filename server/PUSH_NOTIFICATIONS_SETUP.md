# Quest Master - Apple Push Notifications Setup Guide

## Overview

The Quest Master backend now supports Apple Push Notifications (APNs) for iOS devices. This allows users to receive deadline reminders for their tasks automatically.

## Features Implemented

✅ **Device Registration** - iOS app can register device tokens with custom notification settings
✅ **Deadline Alerts** - Automatic notifications before task deadlines
✅ **Customizable Advance Notice** - Users can set how many minutes before deadline to be notified (default: 30 min)
✅ **Task Lifecycle Hooks** - Notifications are automatically scheduled/cancelled when tasks are created, updated, completed, or deleted
✅ **Background Worker** - Cron job runs every minute to send pending notifications
✅ **Notification Settings** - Per-device settings for enabled/disabled, deadline alerts, task reminders, daily digest

## API Endpoints

All notification endpoints require authentication via JWT Bearer token.

### Register Device Token
```
POST /api/notifications/register
Authorization: Bearer {token}

Request Body:
{
  "deviceToken": "hex_string_device_token",
  "platform": "ios",
  "settings": {
    "enabled": true,
    "deadlineAlerts": true,
    "taskReminders": true,
    "dailyDigest": false,
    "advanceNotice": 30
  }
}

Response:
{
  "success": true,
  "message": "Device registered successfully"
}
```

### Unregister Device Token
```
DELETE /api/notifications/unregister
Authorization: Bearer {token}

Request Body:
{
  "deviceToken": "hex_string_device_token"
}

Response:
{
  "success": true,
  "message": "Device unregistered"
}
```

### Get Notification Settings
```
GET /api/notifications/settings
Authorization: Bearer {token}

Response:
{
  "devices": [
    {
      "id": "1234567890",
      "userId": "1",
      "deviceToken": "abc123...",
      "platform": "ios",
      "enabled": true,
      "deadlineAlerts": true,
      "taskReminders": true,
      "dailyDigest": false,
      "advanceNotice": 30,
      "createdAt": "2025-10-18T20:00:00.000Z",
      "updatedAt": "2025-10-18T20:00:00.000Z"
    }
  ]
}
```

### Update Device Settings
```
PATCH /api/notifications/settings/{deviceToken}
Authorization: Bearer {token}

Request Body:
{
  "enabled": true,
  "deadlineAlerts": true,
  "advanceNotice": 60
}

Response:
{
  "success": true,
  "device": { ... }
}
```

### Send Test Notification
```
POST /api/notifications/test
Authorization: Bearer {token}

Request Body:
{
  "message": "Test notification message"
}

Response:
{
  "success": true,
  "sent": 1,
  "results": [ ... ]
}
```

## APNs Configuration Setup

### Step 1: Get APNs Credentials from Apple

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Keys** in the sidebar
4. Click the **+** button to create a new key
5. Enter a name (e.g., "Quest Master APNs Key")
6. Check **Apple Push Notifications service (APNs)**
7. Click **Continue**, then **Register**
8. **Download the .p8 file** (you can only download it once!)
9. Note your **Key ID** (e.g., ABC123XYZ)
10. Note your **Team ID** (visible at top right of page, e.g., DEF456UVW)

### Step 2: Configure Backend

1. Place the downloaded `.p8` file in the server root directory:
   ```bash
   cp ~/Downloads/AuthKey_ABC123XYZ.p8 /home/admin/quest-master/server/
   ```

2. Update your `.env` file with APNs credentials:
   ```bash
   cd /home/admin/quest-master/server
   nano .env
   ```

3. Add these lines (replace with your actual values):
   ```env
   # Apple Push Notification Service (APNs) Configuration
   APNS_KEY_ID=ABC123XYZ
   APNS_TEAM_ID=DEF456UVW
   APNS_KEY_PATH=./AuthKey_ABC123XYZ.p8
   APNS_BUNDLE_ID=com.questmaster.app
   APNS_PRODUCTION=false
   ```

4. Restart the backend service:
   ```bash
   sudo systemctl restart quest-master-backend.service
   ```

5. Verify APNs is configured:
   ```bash
   sudo journalctl -u quest-master-backend.service --since "10 seconds ago" | grep APNs
   ```

   You should see:
   ```
   ✅ APNs initialized (Development mode)
   ```

   If you see a warning instead:
   ```
   ⚠️  APNs not configured. Push notifications will be disabled.
   ```
   Then check your `.env` file and make sure the `.p8` file path is correct.

### Step 3: iOS App Configuration

The iOS app should already be configured to:
1. Request notification permissions
2. Register device token with APNs
3. Send device token to backend via `POST /api/notifications/register`

## How It Works

### Notification Flow

1. **iOS App Registration**
   - App requests notification permission from user
   - iOS provides device token to app
   - App sends token to backend via `/api/notifications/register`
   - Backend stores token with user's notification settings

2. **Task Creation with Deadline**
   - User creates task with deadline via iOS app
   - Backend creates task in database
   - Backend schedules notification based on deadline and user's advance notice setting
   - Notification record is stored in `scheduled-notifications.json`

3. **Background Worker (Cron Job)**
   - Runs every minute
   - Checks for notifications scheduled within the next 5 minutes
   - For each pending notification:
     - Verifies task still exists and is not completed
     - Calculates time until deadline
     - Sends push notification via APNs
     - Marks notification as sent

4. **Task Updates**
   - **Deadline Changed**: Cancels old notification, schedules new one
   - **Task Completed**: Cancels scheduled notification
   - **Task Deleted**: Cancels scheduled notification

5. **Recurring Tasks**
   - When recurring task is completed:
     - Next occurrence is created automatically
     - New notification is scheduled for next occurrence

### Data Storage

All notification data is stored in JSON files:

- **device-tokens.json** - Device tokens and notification settings per user
- **scheduled-notifications.json** - Pending and sent notifications

Example device token record:
```json
{
  "id": "1729283647123",
  "userId": "1",
  "deviceToken": "abc123def456...",
  "platform": "ios",
  "enabled": true,
  "deadlineAlerts": true,
  "taskReminders": true,
  "dailyDigest": false,
  "advanceNotice": 30,
  "createdAt": "2025-10-18T20:00:00.000Z",
  "updatedAt": "2025-10-18T20:00:00.000Z"
}
```

Example scheduled notification:
```json
{
  "id": "1729283647123abc",
  "userId": "1",
  "taskId": "1729283500000",
  "deviceToken": "abc123def456...",
  "notificationType": "deadline",
  "scheduledTime": "2025-10-18T21:30:00.000Z",
  "advanceNotice": 30,
  "sent": false,
  "createdAt": "2025-10-18T20:00:00.000Z"
}
```

## Testing

### Test Notification Endpoint

Use the test endpoint to verify APNs is working:

```bash
# First, get a JWT token by logging in
curl -X POST http://192.168.3.87:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use the token to send a test notification
curl -X POST http://192.168.3.87:3001/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Test notification from backend!"}'
```

### Testing Checklist

- [ ] Register device token from iOS app
- [ ] Send test notification via `/api/notifications/test`
- [ ] Create task with deadline 5 minutes from now
- [ ] Verify notification is scheduled in `scheduled-notifications.json`
- [ ] Wait for notification to arrive on device
- [ ] Complete task and verify notification is cancelled
- [ ] Create task with deadline, then update deadline
- [ ] Delete task and verify notification is cancelled
- [ ] Test recurring task completion

### Monitoring Logs

Watch live logs:
```bash
sudo journalctl -u quest-master-backend.service -f
```

Check for notification worker activity:
```bash
sudo journalctl -u quest-master-backend.service --since "5 minutes ago" | grep -E "notification|APNs"
```

## Troubleshooting

### APNs Not Configured Warning

**Problem:** Server logs show "APNs not configured" warning

**Solution:**
1. Check `.env` file has all required variables set
2. Verify `.p8` file path is correct and file exists
3. Ensure `.p8` file has correct permissions: `chmod 644 AuthKey_*.p8`
4. Restart backend service

### Notifications Not Sending

**Problem:** Notifications are scheduled but not being sent

**Check:**
1. APNs is configured (check logs for "✅ APNs initialized")
2. Notification worker is running (check logs for "📡 Notification worker started")
3. Check `scheduled-notifications.json` for pending notifications
4. Verify device token is still valid (tokens can expire)
5. Check iOS device has notifications enabled for Quest Master app
6. Ensure you're using correct APNs environment (sandbox vs production)

### Wrong APNs Environment

**Problem:** Using production APNs with development build, or vice versa

**Solution:**
- Development/TestFlight builds: `APNS_PRODUCTION=false`
- App Store builds: `APNS_PRODUCTION=true`

### Device Token Invalid

**Problem:** APNs returns "BadDeviceToken" error

**Causes:**
- Using production APNs environment with development device token
- Device token has expired or been revoked
- Bundle ID mismatch between APNs key and app

**Solution:**
1. Verify `APNS_BUNDLE_ID` matches app's bundle ID exactly
2. Ensure `APNS_PRODUCTION` matches app build type
3. Have user unregister and re-register device token

### Notifications Delayed

**Problem:** Notifications arrive late or not at all

**Note:** The worker runs every minute, so notifications will be sent within 1 minute of their scheduled time. APNs may also introduce small delays (usually < 5 seconds).

If delays are longer:
1. Check server time is correct: `date`
2. Verify worker is running: `ps aux | grep node`
3. Check system load: `top`

## Security Considerations

1. **`.p8` File Security**
   - Keep your `.p8` file secure - treat it like a password
   - Never commit it to git (add to `.gitignore`)
   - Set appropriate file permissions: `chmod 600 AuthKey_*.p8`

2. **Device Token Storage**
   - Device tokens are stored in plain text in JSON files
   - Consider encrypting device tokens for production use
   - Regularly clean up invalid/expired tokens

3. **Authentication**
   - All notification endpoints require JWT authentication
   - Users can only register/manage their own device tokens
   - Users cannot send notifications to other users' devices

## Production Deployment

Before deploying to production:

1. **Get Production APNs Credentials**
   - You can use the same APNs key for both dev and production
   - Just change `APNS_PRODUCTION=true`

2. **Database Backup**
   - Regularly backup `device-tokens.json` and `scheduled-notifications.json`
   - Consider migrating to a proper database (PostgreSQL, MySQL)

3. **Monitoring**
   - Set up log monitoring for APNs errors
   - Track notification delivery rates
   - Monitor worker health

4. **Cleanup Job**
   - Old sent notifications are automatically cleaned up after 7 days
   - Invalid device tokens should be removed after repeated failures

## File Structure

```
/home/admin/quest-master/server/
├── services/
│   ├── apnsService.js           # APNs service (sends notifications)
│   └── notificationScheduler.js # Schedules and cancels notifications
├── routes/
│   └── notifications.js         # API endpoints for notifications
├── jobs/
│   └── notificationWorker.js    # Background cron job
├── data/
│   ├── device-tokens.json       # Device tokens storage
│   └── scheduled-notifications.json  # Scheduled notifications
├── AuthKey_*.p8                 # APNs private key
├── .env                         # Environment variables (APNs config)
└── server.js                    # Main server file (mounts routes & worker)
```

## Support

If you encounter issues:

1. Check the logs: `sudo journalctl -u quest-master-backend.service -f`
2. Verify APNs configuration in `.env`
3. Test with `/api/notifications/test` endpoint
4. Check Apple's [APNs documentation](https://developer.apple.com/documentation/usernotifications)

## Future Enhancements

Potential improvements:
- [ ] Daily digest notifications (summary of tasks due today)
- [ ] Task reminder notifications (for tasks without deadlines)
- [ ] Quiet hours support (don't send notifications during certain hours)
- [ ] Notification history tracking
- [ ] Support for Android (FCM)
- [ ] Rich notifications with actions (complete task, snooze, etc.)
- [ ] Batch notifications for users with many tasks
