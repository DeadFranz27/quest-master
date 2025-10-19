import { motion } from 'framer-motion';
import { Check, Trash2, Lock, AlertCircle, Clock, Calendar, Edit2, Flag, Eye, Copy, Star, Archive, Bell, Pin } from 'lucide-react';
import './TaskList.css';

const TaskList = ({ tasks, categories, onComplete, onDelete, onEdit, onSetDeviceBlock, onUpdateProgress }) => {
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // CTF Difficulty System
  const priorityColors = {
    low: '#00FF41',
    medium: '#FFD700',
    high: '#FF6B35',
    critical: '#FF0000'
  };

  const priorityLabels = {
    low: 'EASY',
    medium: 'MEDIUM',
    high: 'HARD',
    critical: 'INSANE'
  };

  // Calculate points based on difficulty
  const getPoints = (priority) => {
    const pointsMap = { low: 25, medium: 50, high: 100, critical: 200 };
    return pointsMap[priority] || 50;
  };

  // Map categories to CTF types
  const getCategoryType = (categoryName) => {
    const typeMap = {
      'Work': '🌐 WEB',
      'Personal': '📝 MISC',
      'Health': '🔍 FORENSICS',
      'Learning': '⚙️ REVERSING'
    };
    return typeMap[categoryName] || `📝 ${categoryName.toUpperCase()}`;
  };

  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 365) {
      const years = Math.floor(days / 365);
      return `${years}y ${days % 365}d`;
    }
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months}mo ${days % 30}d`;
    }
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const groupedTasks = {};
  const categorizedTaskIds = new Set();

  categories.forEach(cat => {
    const catTasks = activeTasks.filter(t => t.category === cat.name);
    groupedTasks[cat.name] = catTasks;
    catTasks.forEach(t => categorizedTaskIds.add(t._id));
  });

  // Find tasks without a valid category
  const uncategorizedTasks = activeTasks.filter(t => !categorizedTaskIds.has(t._id));

  return (
    <div className="task-lists">
      {uncategorizedTasks.length > 0 && (
        <div className="task-section">
          <h2 className="section-title" style={{ color: '#00FF41' }}>
            <span className="category-icon-title">🚩</span>
            [UNCATEGORIZED_CHALLENGES] ({uncategorizedTasks.length})
          </h2>
          <div className="tasks-grid">
            {uncategorizedTasks.map((task, index) => (
              <motion.div
                key={task._id}
                className="task-card"
                style={{ border: '5px solid red !important', display: 'flex', flexDirection: 'row' }}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '10px' }}>
                  <div
                    className="task-category-bar"
                    style={{ backgroundColor: task.categoryColor || '#6366f1' }}
                  />
                  <div className="task-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="task-header">
                      <div className="challenge-meta">
                        <span
                          className="difficulty-badge"
                          style={{
                            color: priorityColors[task.priority],
                            borderColor: priorityColors[task.priority]
                          }}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                        <span className="category-type">{task.category ? getCategoryType(task.category) : '📝 MISC'}</span>
                        <span className="challenge-points">[{getPoints(task.priority)} pts]</span>
                      </div>
                      <div className="task-title-row">
                        <Flag size={16} className="flag-icon" />
                        <span className="task-text">{task.text}</span>
                      </div>
                    </div>

                    {task.deadline && (
                      <div className={`task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                        <Clock size={14} />
                        <span>{getTimeRemaining(task.deadline)}</span>
                        <Calendar size={14} />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="task-progress">
                      <div className="progress-header">
                        <span className="progress-label">Progress</span>
                        <span className="progress-value">{task.progress || 0}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${task.progress || 0}%`,
                            backgroundColor: task.categoryColor || '#6366f1'
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={task.progress || 0}
                          onChange={(e) => onUpdateProgress(task._id, parseInt(e.target.value))}
                          className="progress-slider"
                        />
                      </div>
                    </div>

                    <div className="task-device-block">
                      <select
                        className="device-select"
                        value={task.blocksDevice || ''}
                        onChange={(e) => onSetDeviceBlock(task._id, e.target.value || null)}
                      >
                        <option value="">No device blocked</option>
                        <option value="playstation">PlayStation</option>
                        <option value="xbox">Xbox</option>
                        <option value="tv">TV</option>
                        <option value="computer">Computer</option>
                        <option value="tablet">Tablet</option>
                      </select>
                      {task.blocksDevice && (
                        <div className="device-blocked-indicator">
                          <Lock size={14} />
                          <span>{task.blocksDevice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-actions" style={{ background: 'yellow', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '36px' }}>
                  <motion.button
                    className="task-btn view-btn"
                    onClick={() => alert(`Task Details:\n\n${task.text}\n\nPriority: ${priorityLabels[task.priority]}\nCategory: ${task.category}\nProgress: ${task.progress || 0}%${task.deadline ? '\nDeadline: ' + new Date(task.deadline).toLocaleDateString() : ''}`)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="View task details"
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Eye size={16} />
                  </motion.button>
                  <motion.button
                    className="task-btn copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(task.text);
                      alert('Task copied to clipboard!');
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Copy task"
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Copy size={16} />
                  </motion.button>
                  <motion.button
                    className="task-btn edit-btn"
                    onClick={() => onEdit(task)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit task"
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <motion.button
                    className="task-btn complete-btn"
                    onClick={() => onComplete(task._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Complete task"
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Check size={16} />
                  </motion.button>
                  <motion.button
                    className="task-btn delete-btn"
                    onClick={() => onDelete(task._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete task"
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {categories.map(category => {
        const categoryTasks = groupedTasks[category.name] || [];
        if (categoryTasks.length === 0) return null;

        return (
          <div key={category._id} className="task-section">
            <h2 className="section-title" style={{ color: category.color }}>
              <span className="category-icon-title">{category.icon}</span>
              {category.name} ({categoryTasks.length})
            </h2>
            <div className="tasks-grid">
              {categoryTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  className="task-card"
                  style={{ border: '5px solid blue', display: 'flex', flexDirection: 'row' }}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '10px' }}>
                    <div
                      className="task-category-bar"
                      style={{ backgroundColor: task.categoryColor }}
                    />
                    <div className="task-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="task-header">
                        <div className="task-title-row">
                          <span className="task-icon">{task.icon}</span>
                          <span className="task-text">{task.text}</span>
                        </div>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: priorityColors[task.priority] }}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                      </div>

                      {task.deadline && (
                        <div className={`task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}`}>
                          <Clock size={14} />
                          <span>{getTimeRemaining(task.deadline)}</span>
                          <Calendar size={14} />
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="task-progress">
                        <div className="progress-header">
                          <span className="progress-label">Progress</span>
                          <span className="progress-value">{task.progress || 0}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${task.progress || 0}%`,
                              backgroundColor: task.categoryColor
                            }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={task.progress || 0}
                          onChange={(e) => onUpdateProgress(task._id, parseInt(e.target.value))}
                          className="progress-slider"
                        />
                      </div>

                      <div className="task-device-block">
                        <select
                          className="device-select"
                          value={task.blocksDevice || ''}
                          onChange={(e) => onSetDeviceBlock(task._id, e.target.value || null)}
                        >
                          <option value="">No device blocked</option>
                          <option value="playstation">PlayStation</option>
                          <option value="xbox">Xbox</option>
                          <option value="tv">TV</option>
                          <option value="computer">Computer</option>
                          <option value="tablet">Tablet</option>
                        </select>
                        {task.blocksDevice && (
                          <div className="device-blocked-indicator">
                            <Lock size={14} />
                            <span>{task.blocksDevice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="task-actions" style={{ background: 'yellow', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '36px' }}>
                    <motion.button
                      className="task-btn view-btn"
                      onClick={() => alert(`Task Details:\n\n${task.text}\n\nPriority: ${priorityLabels[task.priority]}\nCategory: ${task.category}\nProgress: ${task.progress || 0}%${task.deadline ? '\nDeadline: ' + new Date(task.deadline).toLocaleDateString() : ''}`)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="View task details"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                    >
                      <Eye size={16} />
                    </motion.button>
                    <motion.button
                      className="task-btn copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(task.text);
                        alert('Task copied to clipboard!');
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Copy task"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                    >
                      <Copy size={16} />
                    </motion.button>
                    <motion.button
                      className="task-btn edit-btn"
                      onClick={() => onEdit(task)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Edit task"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      className="task-btn complete-btn"
                      onClick={() => onComplete(task._id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Complete task"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                    >
                      <Check size={16} />
                    </motion.button>
                    <motion.button
                      className="task-btn delete-btn"
                      onClick={() => onDelete(task._id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Delete task"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {completedTasks.length > 0 && (
        <div className="task-section">
          <h2 className="section-title completed-title">
            <Check size={24} />
            Completed Quests ({completedTasks.length})
          </h2>
          <div className="tasks-grid">
            {completedTasks.map((task, index) => (
              <motion.div
                key={task._id}
                className="task-card completed"
                style={{ border: '5px solid green', display: 'flex', flexDirection: 'row' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: index * 0.05 }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '10px' }}>
                  <div
                    className="task-category-bar"
                    style={{ backgroundColor: task.categoryColor }}
                  />
                  <div className="task-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="task-header">
                      <div className="task-title-row">
                        <span className="task-icon">{task.icon}</span>
                        <span className="task-text completed-text">{task.text}</span>
                      </div>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: priorityColors[task.priority] }}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="task-actions" style={{ background: 'yellow', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '36px' }}>
                  <motion.button
                    className="task-btn delete-btn"
                    onClick={() => onDelete(task._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
