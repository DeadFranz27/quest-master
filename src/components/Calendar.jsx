import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Calendar({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getWeekDays = (date) => {
    const days = [];
    const currentDay = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getTasksForDate = (date, includeCompleted = false) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.deadline) return false;
      if (!includeCompleted && task.completed) return false;
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);

    return (
      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-header-cell">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day, showCompleted);
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isSelected = isSameDate(day, selectedDate);

          return (
            <motion.div
              key={index}
              className={`calendar-cell ${!day ? 'empty' : ''} ${isCurrentDay ? 'today' : ''} ${!isCurrentMonthDay ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => day && setSelectedDate(day)}
            >
              {day && (
                <>
                  <div className="calendar-date">{day.getDate()}</div>
                  <div className="calendar-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task._id}
                        className={`calendar-task ${task.priority} ${task.completed ? 'completed' : ''}`}
                        title={task.text}
                      >
                        <span className="calendar-task-icon">{task.icon}</span>
                        <span className="calendar-task-text">{task.text}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="calendar-task-more">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);

    return (
      <div className="calendar-week-grid">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const isCurrentDay = isToday(day);

          return (
            <motion.div
              key={index}
              className={`calendar-week-day ${isCurrentDay ? 'today' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="calendar-week-header">
                <div className="calendar-week-day-name">{dayNames[day.getDay()]}</div>
                <div className="calendar-week-date">{day.getDate()}</div>
              </div>
              <div className="calendar-week-tasks">
                {dayTasks.length === 0 ? (
                  <div className="calendar-week-empty">No tasks</div>
                ) : (
                  dayTasks.map(task => (
                    <div
                      key={task._id}
                      className={`calendar-week-task ${task.priority} ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="calendar-week-task-time">
                        <Clock size={12} />
                        {new Date(task.deadline).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      <div className="calendar-week-task-content">
                        <span className="calendar-week-task-icon">{task.icon}</span>
                        <span className="calendar-week-task-text">{task.text}</span>
                      </div>
                      <div className="calendar-week-task-category">{task.category}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            className="calendar-nav-btn"
            onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-view-controls">
          <label className="calendar-checkbox">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            <span>Show completed</span>
          </label>
          <button className="calendar-today-btn" onClick={goToToday}>
            Today
          </button>
          <div className="calendar-view-toggle">
            <button
              className={`calendar-view-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button
              className={`calendar-view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {view === 'month' ? renderMonthView() : renderWeekView()}

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              className="calendar-day-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <button className="close-btn" onClick={() => setSelectedDate(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="calendar-day-tasks">
                {getTasksForDate(selectedDate, true).length === 0 ? (
                  <div className="calendar-day-empty">
                    No tasks scheduled for this day
                  </div>
                ) : (
                  getTasksForDate(selectedDate, true).map(task => (
                    <div
                      key={task._id}
                      className={`calendar-day-task ${task.priority} ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="calendar-day-task-icon">{task.icon}</div>
                      <div className="calendar-day-task-content">
                        <div className="calendar-day-task-title">{task.text}</div>
                        <div className="calendar-day-task-meta">
                          <span className={`calendar-day-task-priority ${task.priority}`}>
                            {task.priority}
                          </span>
                          {task.category && (
                            <span className="calendar-day-task-category">
                              {task.category}
                            </span>
                          )}
                          {task.deadline && (
                            <span className="calendar-day-task-time">
                              <Clock size={14} />
                              {new Date(task.deadline).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.completed && (
                        <div className="calendar-day-task-completed-badge">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Calendar;
