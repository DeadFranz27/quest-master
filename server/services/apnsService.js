import apn from 'apn';
import dotenv from 'dotenv';

dotenv.config();

class APNsService {
  constructor() {
    this.provider = null;
    this.initializeProvider();
  }

  initializeProvider() {
    // Check if APNs is configured
    if (!process.env.APNS_KEY_PATH || !process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID) {
      console.log('⚠️  APNs not configured. Push notifications will be disabled.');
      console.log('   Set APNS_KEY_PATH, APNS_KEY_ID, and APNS_TEAM_ID in .env to enable.');
      return;
    }

    try {
      this.provider = new apn.Provider({
        token: {
          key: process.env.APNS_KEY_PATH,
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID
        },
        production: process.env.APNS_PRODUCTION === 'true'
      });
      console.log(`✅ APNs initialized (${process.env.APNS_PRODUCTION === 'true' ? 'Production' : 'Development'} mode)`);
    } catch (error) {
      console.error('❌ APNs initialization error:', error.message);
      this.provider = null;
    }
  }

  async sendNotification(deviceToken, title, body, data = {}) {
    if (!this.provider) {
      console.log('⚠️  APNs not available. Skipping notification.');
      return { sent: [], failed: [{ device: deviceToken, error: 'APNs not configured' }] };
    }

    const notification = new apn.Notification();
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
    notification.badge = 1;
    notification.sound = 'default';
    notification.alert = {
      title: title,
      body: body
    };
    notification.payload = data;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.questmaster.app';

    try {
      const result = await this.provider.send(notification, deviceToken);

      if (result.sent && result.sent.length > 0) {
        console.log(`✅ APNs notification sent to ${deviceToken.substring(0, 10)}...`);
      }

      if (result.failed && result.failed.length > 0) {
        console.error(`❌ APNs failed for ${deviceToken.substring(0, 10)}...:`, result.failed[0].response);
      }

      return result;
    } catch (error) {
      console.error('❌ APNs send error:', error.message);
      throw error;
    }
  }

  isConfigured() {
    return this.provider !== null;
  }
}

export default new APNsService();
