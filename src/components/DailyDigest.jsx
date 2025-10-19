import { useState, useEffect } from 'react';
import { Bot, RefreshCw, Sparkles, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function DailyDigest({ user, onClose }) {
  const [digest, setDigest] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const loadDigest = async () => {
    if (!user.aiApiKeys || !user.aiApiKeys.selectedProvider) {
      setError('Please configure your AI API keys in Settings first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/daily-digest`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDigest(data.digest);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'No digest available');
      }
    } catch (err) {
      console.error('Daily digest error:', err);
      setError('Failed to load daily digest.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewDigest = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/daily-digest/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDigest(data.digest);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate digest');
      }
    } catch (err) {
      console.error('Generate digest error:', err);
      setError('Failed to generate digest.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load digest on mount if API keys are configured
    if (user.aiApiKeys && user.aiApiKeys.selectedProvider) {
      loadDigest();
    }
  }, []);

  if (!digest && !loading && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isMinimized && (
        <motion.div
          className="daily-digest-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="daily-digest-header">
            <div className="daily-digest-title">
              <Bot size={24} className="digest-icon" />
              <h3>Daily Digest</h3>
              {stats && (
                <span className="digest-badge">
                  {stats.pending} active • {stats.completed} done
                </span>
              )}
            </div>
            <div className="daily-digest-actions">
              <button
                className="digest-action-btn"
                onClick={generateNewDigest}
                disabled={loading}
                title="Generate new digest"
              >
                <Sparkles size={18} className={loading ? 'spinning' : ''} />
              </button>
              <button
                className="digest-action-btn"
                onClick={loadDigest}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              </button>
              <button
                className="digest-action-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              <button
                className="digest-action-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="daily-digest-content">
              {loading && (
                <div className="digest-loading">
                  <Sparkles size={32} className="sparkle-icon" />
                  <p>Generating your personalized daily digest...</p>
                </div>
              )}

              {error && (
                <div className="digest-error">
                  <AlertCircle size={24} />
                  <p>{error}</p>
                  {!user.aiApiKeys?.selectedProvider && (
                    <button
                      className="configure-ai-btn"
                      onClick={() => window.location.hash = '#settings'}
                    >
                      Configure AI Settings
                    </button>
                  )}
                </div>
              )}

              {digest && !loading && (
                <div className="digest-text">
                  <ReactMarkdown>{digest}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {isMinimized && (
        <motion.button
          className="daily-digest-minimized"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setIsMinimized(false)}
        >
          <Bot size={20} />
          <span>Show Daily Digest</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default DailyDigest;
