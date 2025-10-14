import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Save, RefreshCw, Shield, UserPlus,
  Trash2, CheckCircle, AlertCircle, LogOut, Crown
} from 'lucide-react';

const API_URL = 'http://localhost:3001';

function UserProfile({ user, token, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);

  // Account settings
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin panel
  const [users, setUsers] = useState([]);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser.isAdmin) {
      fetchUsers();
    }
  }, [currentUser.isAdmin]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        onUpdateUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUpdateAccount = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const updateData = {
        username,
        email
      };

      // Only include password if user wants to change it
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
          setLoading(false);
          return;
        }
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdateUser(updatedUser);
        setSaved(true);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSaved(false);
          setMessage(null);
        }, 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    }

    setLoading(false);
  };

  const handleAddUser = async () => {
    console.log('handleAddUser called', { newUserUsername, newUserPassword });

    if (!newUserUsername || !newUserPassword) {
      setMessage({ type: 'error', text: 'Username and password are required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('Sending request to create user...');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newUserUsername,
          email: newUserEmail,
          password: newUserPassword,
          isAdmin: newUserIsAdmin
        })
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const newUser = JSON.parse(responseText);
        console.log('User created:', newUser);
        setMessage({ type: 'success', text: 'User created successfully!' });
        setNewUserUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserIsAdmin(false);
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        let errorMessage = 'Failed to create user';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}): ${responseText.substring(0, 100)}`;
        }
        console.error('Failed to create user:', errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating user' });
    }

    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while deleting user' });
    }

    setLoading(false);
  };

  return (
    <div className="settings-container">
      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="settings-title">User Profile</h2>
        <p className="settings-subtitle">Manage your account settings and preferences</p>
      </motion.div>

      {message && (
        <motion.div
          className={`notification-test-result ${message.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'error' && <AlertCircle size={20} />}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <User size={18} />
          Account Settings
        </button>
        {currentUser.isAdmin && (
          <button
            className={`profile-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Shield size={18} />
            Admin Panel
          </button>
        )}
        <button
          className="profile-tab logout-tab"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-content"
        >
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <User size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Profile Information</h3>
                <p className="settings-card-description">Update your account details</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div className="profile-stats">
                <div className="profile-stat-item">
                  <div className="profile-stat-label">Level</div>
                  <div className="profile-stat-value">{currentUser.level}</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-label">Total XP</div>
                  <div className="profile-stat-value">{currentUser.totalPoints || 0}</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-label">Role</div>
                  <div className="profile-stat-value">
                    {currentUser.isAdmin ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Crown size={16} style={{ color: '#fbbf24' }} />
                        Admin
                      </span>
                    ) : 'User'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Lock size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Change Password</h3>
                <p className="settings-card-description">Update your password (leave blank to keep current)</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <motion.div
            className="settings-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              className={`settings-btn settings-btn-primary ${saved ? 'saved' : ''}`}
              onClick={handleUpdateAccount}
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
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Admin Panel Tab */}
      {activeTab === 'admin' && currentUser.isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-content"
        >
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Add New User</h3>
                <p className="settings-card-description">Create a new user account</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email (optional)</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@email.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={newUserIsAdmin}
                    onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  />
                  <span>Grant admin privileges</span>
                </label>
              </div>

              <button
                className="settings-btn settings-btn-primary"
                onClick={handleAddUser}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw size={18} className="spinning" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    Add User
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                <Shield size={24} />
              </div>
              <div>
                <h3 className="settings-card-title">Manage Users</h3>
                <p className="settings-card-description">View and manage all users</p>
              </div>
            </div>

            <div className="users-list">
              {users.length === 0 ? (
                <div className="users-list-empty">No users found</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="user-item">
                    <div className="user-item-avatar">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-item-info">
                      <div className="user-item-name">
                        {u.username}
                        {u.isAdmin && (
                          <Crown size={14} style={{ color: '#fbbf24', marginLeft: '6px' }} />
                        )}
                      </div>
                      <div className="user-item-email">{u.email || 'No email'}</div>
                      <div className="user-item-meta">
                        Level {u.level} • {u.totalPoints || 0} XP
                      </div>
                    </div>
                    {u.id !== currentUser.id && (
                      <button
                        className="user-item-delete"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default UserProfile;
