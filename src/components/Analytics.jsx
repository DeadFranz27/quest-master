import { useMemo } from 'react';
import { TrendingUp, Target, Award, Activity, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

function Analytics({ tasks, categories, user }) {
  const analytics = useMemo(() => {
    const completed = tasks.filter(t => t.completed);
    const active = tasks.filter(t => !t.completed);

    // Category breakdown
    const categoryStats = categories.map(cat => {
      const categoryTasks = tasks.filter(t => t.category === cat.name);
      const categoryCompleted = categoryTasks.filter(t => t.completed);
      return {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        total: categoryTasks.length,
        completed: categoryCompleted.length,
        percentage: categoryTasks.length > 0 ? Math.round((categoryCompleted.length / categoryTasks.length) * 100) : 0
      };
    });

    // Priority breakdown
    const priorityStats = ['low', 'medium', 'high', 'critical'].map(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority);
      const priorityCompleted = priorityTasks.filter(t => t.completed);
      return {
        name: priority,
        total: priorityTasks.length,
        completed: priorityCompleted.length,
        active: priorityTasks.filter(t => !t.completed).length
      };
    });

    // Recent activity (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const dailyCompletion = last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const completedOnDay = completed.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= date && completedDate < nextDay;
      });

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count: completedOnDay.length
      };
    });

    // Streak calculation
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const hasCompletion = completed.some(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= checkDate && completedDate < nextDay;
      });

      if (hasCompletion) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Total XP gained
    const totalXP = user.totalPoints || 0;

    // Average completion time (mock data for now)
    const avgTasksPerDay = completed.length > 0 ? (completed.length / 30).toFixed(1) : 0;

    return {
      completed: completed.length,
      active: active.length,
      total: tasks.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      categoryStats,
      priorityStats,
      dailyCompletion,
      currentStreak,
      totalXP,
      avgTasksPerDay
    };
  }, [tasks, categories, user]);

  const maxDailyCount = Math.max(...analytics.dailyCompletion.map(d => d.count), 1);

  return (
    <div className="analytics-container">
      {/* Overview Stats */}
      <div className="analytics-stats-grid">
        <motion.div
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Flame size={24} />
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.currentStreak}</div>
            <div className="analytics-stat-label">Day Streak</div>
          </div>
        </motion.div>

        <motion.div
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Target size={24} />
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.completionRate}%</div>
            <div className="analytics-stat-label">Completion Rate</div>
          </div>
        </motion.div>

        <motion.div
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Activity size={24} />
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.avgTasksPerDay}</div>
            <div className="analytics-stat-label">Tasks/Day Avg</div>
          </div>
        </motion.div>

        <motion.div
          className="analytics-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="analytics-stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <Award size={24} />
          </div>
          <div className="analytics-stat-content">
            <div className="analytics-stat-value">{analytics.totalXP.toLocaleString()}</div>
            <div className="analytics-stat-label">Total XP</div>
          </div>
        </motion.div>
      </div>

      {/* Activity Chart */}
      <motion.div
        className="analytics-chart-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">
            <TrendingUp size={20} />
            Completion Trend (Last 7 Days)
          </h3>
        </div>
        <div className="analytics-bar-chart">
          {analytics.dailyCompletion.map((day, index) => (
            <div key={index} className="analytics-bar-wrapper">
              <div className="analytics-bar-container">
                <motion.div
                  className="analytics-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxDailyCount) * 100}%` }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                >
                  {day.count > 0 && <span className="analytics-bar-value">{day.count}</span>}
                </motion.div>
              </div>
              <div className="analytics-bar-label">{day.date.split(',')[0]}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="analytics-grid">
        {/* Category Breakdown */}
        <motion.div
          className="analytics-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">
              <CalendarIcon size={20} />
              Category Breakdown
            </h3>
          </div>
          <div className="analytics-category-list">
            {analytics.categoryStats.map((cat, index) => (
              <motion.div
                key={cat.name}
                className="analytics-category-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="analytics-category-info">
                  <span className="analytics-category-icon">{cat.icon}</span>
                  <span className="analytics-category-name">{cat.name}</span>
                </div>
                <div className="analytics-category-stats">
                  <span className="analytics-category-count">{cat.completed}/{cat.total}</span>
                  <div className="analytics-category-bar">
                    <div
                      className="analytics-category-progress"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                  <span className="analytics-category-percentage">{cat.percentage}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Priority Breakdown */}
        <motion.div
          className="analytics-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">
              <Target size={20} />
              Priority Distribution
            </h3>
          </div>
          <div className="analytics-priority-list">
            {analytics.priorityStats.map((priority, index) => {
              const colors = {
                low: '#10b981',
                medium: '#f59e0b',
                high: '#ef4444',
                critical: '#dc2626'
              };

              return (
                <motion.div
                  key={priority.name}
                  className="analytics-priority-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="analytics-priority-header">
                    <span
                      className="analytics-priority-badge"
                      style={{ backgroundColor: colors[priority.name] }}
                    >
                      {priority.name}
                    </span>
                    <span className="analytics-priority-total">{priority.total} tasks</span>
                  </div>
                  <div className="analytics-priority-breakdown">
                    <div className="analytics-priority-stat">
                      <span className="analytics-priority-stat-label">Completed</span>
                      <span className="analytics-priority-stat-value">{priority.completed}</span>
                    </div>
                    <div className="analytics-priority-stat">
                      <span className="analytics-priority-stat-label">Active</span>
                      <span className="analytics-priority-stat-value">{priority.active}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Analytics;
