import { useState, useEffect } from 'react';
import { Server, Wifi, Database, Shield, Save, RefreshCw, User, Bell, Download, Trash, Info, Lock, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function Settings({ user }) {
  const [settings, setSettings] = useState({
    haUrl: 'http://homeassistant.local:8123',
    haToken: '',
    serverPort: '3001',
    jwtSecret: '',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    loadSettings();
    setTwoFactorEnabled(user.twoFactorEnabled || false);
  }, [user]);

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('serverSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  // 2FA Functions
  const handleSetup2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShow2FASetup(true);
      } else {
        alert(data.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      alert('Failed to setup 2FA');
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret,
          token: verificationCode
        })
      });

      const data = await response.json();
      if (response.ok) {
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setVerificationCode('');
        alert('Two-factor authentication enabled successfully!');
      } else {
        alert(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA enable error:', error);
      alert('Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      alert('Please enter your password');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: disablePassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setTwoFactorEnabled(false);
        setDisablePassword('');
        alert('Two-factor authentication disabled');
      } else {
        alert(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      alert('Failed to disable 2FA');
    }
  };

  const handleSave = () => {
    setLoading(true);

    // Save to localStorage
    localStorage.setItem('serverSettings', JSON.stringify(settings));

    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        haUrl: 'http://homeassistant.local:8123',
        haToken: '',
        serverPort: '3001',
        jwtSecret: '',
      };
      setSettings(defaultSettings);
      localStorage.setItem('serverSettings', JSON.stringify(defaultSettings));
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export
    alert('Data export feature coming soon!');
  };

  const handleClearCompleted = () => {
    // TODO: Implement clear completed tasks
    if (confirm('Are you sure you want to delete all completed tasks? This cannot be undone.')) {
      alert('Clear completed feature coming soon!');
    }
  };

  return (
    <div className="settings-container">
      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Configure your Quest Master server and preferences</p>
      </motion.div>

      <div className="settings-grid">
        {/* Account Info */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <User size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Account Information</h3>
              <p className="settings-card-description">View your account details</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={user.username}
                disabled
              />
              <span className="form-hint">Username cannot be changed</span>
            </div>

            <div className="form-group">
              <label className="form-label">Level & XP</label>
              <input
                type="text"
                className="form-input"
                value={`Level ${user.level} - ${user.xp}/${user.xpToNextLevel} XP`}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Points Earned</label>
              <input
                type="text"
                className="form-input"
                value={user.totalPoints.toLocaleString()}
                disabled
              />
            </div>
          </div>
        </motion.div>

        {/* Two-Factor Authentication */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Lock size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Two-Factor Authentication</h3>
              <p className="settings-card-description">Add an extra layer of security to your account</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className={`status-badge ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <span className="form-hint">
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              </span>
            </div>

            {!twoFactorEnabled && !show2FASetup && (
              <button className="settings-action-btn" onClick={handleSetup2FA}>
                <Shield size={18} />
                Enable Two-Factor Authentication
              </button>
            )}

            {show2FASetup && (
              <div className="twofa-setup">
                <div className="form-group">
                  <label className="form-label">Step 1: Scan QR Code</label>
                  {qrCode && (
                    <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '8px', marginBottom: '16px' }}>
                      <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px' }} />
                    </div>
                  )}
                  <span className="form-hint">Scan this QR code with your authenticator app</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Step 2: Enter Verification Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                  />
                  <span className="form-hint">Enter the 6-digit code from your authenticator app</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="settings-action-btn" onClick={handleEnable2FA} style={{ flex: 1 }}>
                    <Key size={18} />
                    Verify & Enable
                  </button>
                  <button
                    className="settings-action-btn danger-btn"
                    onClick={() => {
                      setShow2FASetup(false);
                      setVerificationCode('');
                      setQrCode('');
                      setSecret('');
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="twofa-disable">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your password to disable 2FA"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                  <span className="form-hint">Confirm your password to disable two-factor authentication</span>
                </div>
                <button className="settings-action-btn danger-btn" onClick={handleDisable2FA}>
                  <Lock size={18} />
                  Disable Two-Factor Authentication
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Home Assistant Integration */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #41bfd9 0%, #38a8c5 100%)' }}>
              <Wifi size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Home Assistant</h3>
              <p className="settings-card-description">Connect to your Home Assistant instance</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">
                <Server size={16} />
                Home Assistant URL
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="http://homeassistant.local:8123"
                value={settings.haUrl}
                onChange={(e) => setSettings({ ...settings, haUrl: e.target.value })}
              />
              <span className="form-hint">The URL where your Home Assistant is running</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={16} />
                Long-Lived Access Token
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Your Home Assistant token"
                value={settings.haToken}
                onChange={(e) => setSettings({ ...settings, haToken: e.target.value })}
              />
              <span className="form-hint">Generate this in Home Assistant Profile → Long-Lived Access Tokens</span>
            </div>
          </div>
        </motion.div>

        {/* Server Configuration */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Database size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Server Configuration</h3>
              <p className="settings-card-description">Configure your Quest Master server</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">
                <Database size={16} />
                Server Port
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="3001"
                value={settings.serverPort}
                onChange={(e) => setSettings({ ...settings, serverPort: e.target.value })}
              />
              <span className="form-hint">The port where the Quest Master server runs</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={16} />
                JWT Secret
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Your JWT secret key"
                value={settings.jwtSecret}
                onChange={(e) => setSettings({ ...settings, jwtSecret: e.target.value })}
              />
              <span className="form-hint">Secret key for JWT token encryption (change in production)</span>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <Download size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Data Management</h3>
              <p className="settings-card-description">Export and manage your data</p>
            </div>
          </div>

          <div className="settings-form">
            <button className="settings-action-btn export-btn" onClick={handleExportData}>
              <Download size={18} />
              Export All Tasks (JSON)
            </button>
            <button className="settings-action-btn danger-btn" onClick={handleClearCompleted}>
              <Trash size={18} />
              Clear Completed Tasks
            </button>
          </div>
        </motion.div>

        {/* Information Card */}
        <motion.div
          className="settings-card settings-info-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Info size={24} />
            </div>
            <div>
              <h3 className="settings-card-title">Important Notes</h3>
            </div>
          </div>

          <div className="settings-info-content">
            <ul className="settings-info-list">
              <li>These settings are stored in your browser's localStorage</li>
              <li>Server changes require restarting the Quest Master server</li>
              <li>Update the .env file on the server for permanent changes</li>
              <li>Home Assistant integration enables device blocking features</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        className="settings-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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

export default Settings;
