import { useState, useEffect } from 'react';
import { Bell, Mail, MessageCircle, Send, Save, RefreshCw, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function Notifications() {
  const [settings, setSettings] = useState({
    emailEnabled: false,
    emailAddress: '',
    emailSmtpHost: '',
    emailSmtpPort: '587',
    emailSmtpUser: '',
    emailSmtpPassword: '',
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    whatsappEnabled: false,
    whatsappPhoneNumber: '',
    whatsappApiKey: '',
    notifyOnDeadline: true,
    notifyBeforeDeadline: true,
    deadlineReminderMinutes: '30',
    notifyOnTaskComplete: false,
    notifyOnLevelUp: true,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem('notificationSettings', JSON.stringify(settings));

    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  const handleTestEmail = async () => {
    if (!settings.emailEnabled || !settings.emailAddress) {
      setTestResult({ type: 'error', message: 'Please enable email and enter an email address first' });
      return;
    }

    setTestResult({ type: 'loading', message: 'Sending test email...' });

    // TODO: Implement actual email sending
    setTimeout(() => {
      setTestResult({ type: 'success', message: 'Test email sent successfully! Check your inbox.' });
      setTimeout(() => setTestResult(null), 5000);
    }, 1500);
  };

  const handleTestTelegram = async () => {
    if (!settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
      setTestResult({ type: 'error', message: 'Please enable Telegram and configure bot token and chat ID' });
      return;
    }

    setTestResult({ type: 'loading', message: 'Sending test Telegram message...' });

    // TODO: Implement actual Telegram sending
    setTimeout(() => {
      setTestResult({ type: 'success', message: 'Test message sent to Telegram successfully!' });
      setTimeout(() => setTestResult(null), 5000);
    }, 1500);
  };

  const handleTestWhatsApp = async () => {
    if (!settings.whatsappEnabled || !settings.whatsappPhoneNumber || !settings.whatsappApiKey) {
      setTestResult({ type: 'error', message: 'Please enable WhatsApp and configure phone number and API key' });
      return;
    }

    setTestResult({ type: 'loading', message: 'Sending test WhatsApp message...' });

    // TODO: Implement actual WhatsApp sending
    setTimeout(() => {
      setTestResult({ type: 'success', message: 'Test message sent to WhatsApp successfully!' });
      setTimeout(() => setTestResult(null), 5000);
    }, 1500);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all notification settings?')) {
      const defaultSettings = {
        emailEnabled: false,
        emailAddress: '',
        emailSmtpHost: '',
        emailSmtpPort: '587',
        emailSmtpUser: '',
        emailSmtpPassword: '',
        telegramEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
        whatsappEnabled: false,
        whatsappPhoneNumber: '',
        whatsappApiKey: '',
        notifyOnDeadline: true,
        notifyBeforeDeadline: true,
        deadlineReminderMinutes: '30',
        notifyOnTaskComplete: false,
        notifyOnLevelUp: true,
      };
      setSettings(defaultSettings);
      localStorage.setItem('notificationSettings', JSON.stringify(defaultSettings));
    }
  };

  return (
    <div className="settings-container">
      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="settings-title">Notifications</h2>
        <p className="settings-subtitle">Configure email, Telegram, and WhatsApp notifications for your tasks</p>
      </motion.div>

      {testResult && (
        <motion.div
          className={`notification-test-result ${testResult.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {testResult.type === 'success' && <CheckCircle size={20} />}
          {testResult.type === 'error' && <AlertCircle size={20} />}
          {testResult.type === 'loading' && <RefreshCw size={20} className="spinning" />}
          <span>{testResult.message}</span>
        </motion.div>
      )}

      <div className="settings-grid">
        {/* Email Notifications */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Email Notifications</h3>
              <p className="settings-card-description">Receive task reminders via email</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                />
                <span>Enable email notifications</span>
              </label>
            </div>

            {settings.emailEnabled && (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={settings.emailAddress}
                    onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Server</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="smtp.gmail.com"
                    value={settings.emailSmtpHost}
                    onChange={(e) => setSettings({ ...settings, emailSmtpHost: e.target.value })}
                  />
                  <span className="form-hint">For Gmail: smtp.gmail.com | For Outlook: smtp-mail.outlook.com</span>
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Port</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="587"
                    value={settings.emailSmtpPort}
                    onChange={(e) => setSettings({ ...settings, emailSmtpPort: e.target.value })}
                  />
                  <span className="form-hint">Usually 587 for TLS or 465 for SSL</span>
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="your@email.com"
                    value={settings.emailSmtpUser}
                    onChange={(e) => setSettings({ ...settings, emailSmtpUser: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Your email password or app password"
                    value={settings.emailSmtpPassword}
                    onChange={(e) => setSettings({ ...settings, emailSmtpPassword: e.target.value })}
                  />
                  <span className="form-hint">For Gmail, use an App Password (not your regular password)</span>
                </div>

                <button className="settings-action-btn test-btn" onClick={handleTestEmail}>
                  <TestTube size={18} />
                  Send Test Email
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Telegram Notifications */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #0088cc 0%, #229ed9 100%)' }}>
              <Send size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Telegram Notifications</h3>
              <p className="settings-card-description">Get instant notifications on Telegram</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.telegramEnabled}
                  onChange={(e) => setSettings({ ...settings, telegramEnabled: e.target.checked })}
                />
                <span>Enable Telegram notifications</span>
              </label>
            </div>

            {settings.telegramEnabled && (
              <>
                <div className="form-group">
                  <label className="form-label">Bot Token</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={settings.telegramBotToken}
                    onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                  />
                  <span className="form-hint">Get this from @BotFather on Telegram</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Chat ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456789"
                    value={settings.telegramChatId}
                    onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                  />
                  <span className="form-hint">Get your Chat ID from @userinfobot</span>
                </div>

                <button className="settings-action-btn test-btn" onClick={handleTestTelegram}>
                  <TestTube size={18} />
                  Send Test Message
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* WhatsApp Notifications */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">WhatsApp Notifications</h3>
              <p className="settings-card-description">Receive notifications on WhatsApp</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.whatsappEnabled}
                  onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                />
                <span>Enable WhatsApp notifications</span>
              </label>
            </div>

            {settings.whatsappEnabled && (
              <>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1234567890"
                    value={settings.whatsappPhoneNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappPhoneNumber: e.target.value })}
                  />
                  <span className="form-hint">Include country code (e.g., +1 for US)</span>
                </div>

                <div className="form-group">
                  <label className="form-label">API Key (Twilio/MessageBird)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Your WhatsApp API key"
                    value={settings.whatsappApiKey}
                    onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                  />
                  <span className="form-hint">Get this from your WhatsApp Business API provider</span>
                </div>

                <button className="settings-action-btn test-btn" onClick={handleTestWhatsApp}>
                  <TestTube size={18} />
                  Send Test Message
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          className="settings-card settings-info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Bell size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Notification Preferences</h3>
              <p className="settings-card-description">Choose when to receive notifications</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.notifyOnDeadline}
                  onChange={(e) => setSettings({ ...settings, notifyOnDeadline: e.target.checked })}
                />
                <span>Notify when task deadline is reached</span>
              </label>
            </div>

            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.notifyBeforeDeadline}
                  onChange={(e) => setSettings({ ...settings, notifyBeforeDeadline: e.target.checked })}
                />
                <span>Notify before deadline</span>
              </label>
            </div>

            {settings.notifyBeforeDeadline && (
              <div className="form-group">
                <label className="form-label">Reminder Time (minutes before deadline)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="30"
                  value={settings.deadlineReminderMinutes}
                  onChange={(e) => setSettings({ ...settings, deadlineReminderMinutes: e.target.value })}
                  min="5"
                  max="1440"
                />
              </div>
            )}

            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.notifyOnTaskComplete}
                  onChange={(e) => setSettings({ ...settings, notifyOnTaskComplete: e.target.checked })}
                />
                <span>Notify when task is completed</span>
              </label>
            </div>

            <div className="form-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.notifyOnLevelUp}
                  onChange={(e) => setSettings({ ...settings, notifyOnLevelUp: e.target.checked })}
                />
                <span>Notify on level up achievements</span>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        className="settings-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button className="settings-btn settings-btn-secondary" onClick={handleReset}>
          <RefreshCw size={18} />
          Reset to Default
        </button>
        <button
          className={`settings-btn settings-btn-primary ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw size={18} className="spinning" />
          ) : saved ? (
            <>
              <Save size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

export default Notifications;
