import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MoreVertical, X, GripVertical } from 'lucide-react';
import './KanbanBoard.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function KanbanBoard({ token, tasks, onTaskUpdate, onTaskClick }) {
  const [columns, setColumns] = useState([]);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6366f1');
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedColumnForTask, setSelectedColumnForTask] = useState(null);
  const [showRemoveZone, setShowRemoveZone] = useState(false);
  const [trashHovered, setTrashHovered] = useState(false);

  useEffect(() => {
    fetchColumns();
  }, [token]);

  const fetchColumns = async () => {
    try {
      const response = await fetch(`${API_URL}/api/kanban/columns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setColumns(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/kanban/columns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newColumnName,
          color: newColumnColor,
          order: columns.length
        })
      });

      if (response.ok) {
        setNewColumnName('');
        setNewColumnColor('#6366f1');
        setShowAddColumn(false);
        fetchColumns();
      }
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  const handleEditColumn = async (columnId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/kanban/columns/${columnId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setEditingColumn(null);
        fetchColumns();
      }
    } catch (error) {
      console.error('Error editing column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!confirm('Are you sure you want to delete this column? Tasks will not be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/kanban/columns/${columnId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchColumns();
      }
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const getTasksForColumn = (column) => {
    // Show both parent tasks and subtasks that have kanbanColumnId set
    return tasks.filter(t => t.kanbanColumnId === column._id);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    setShowRemoveZone(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(column._id);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, column) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    setShowRemoveZone(false);

    if (!draggedTask) return;

    try {
      const updates = { kanbanColumnId: column._id };

      await fetch(`${API_URL}/api/tasks/${draggedTask._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      onTaskUpdate();
      setDraggedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleRemoveFromColumn = async (e) => {
    e.preventDefault();
    setShowRemoveZone(false);

    if (!draggedTask) return;

    try {
      await fetch(`${API_URL}/api/tasks/${draggedTask._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kanbanColumnId: null })
      });

      onTaskUpdate();
      setDraggedTask(null);
    } catch (error) {
      console.error('Error removing task from column:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="kanban-board">
      <div className="kanban-columns">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column);

          return (
            <div
              key={column._id}
              className={`kanban-column ${draggedOverColumn === column._id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="column-header" style={{ borderTopColor: column.color }}>
                <div className="column-title">
                  <div className="column-color-indicator" style={{ backgroundColor: column.color }}></div>
                  {editingColumn === column._id ? (
                    <input
                      type="text"
                      defaultValue={column.name}
                      onBlur={(e) => handleEditColumn(column._id, { name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditColumn(column._id, { name: e.target.value });
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3>{column.name}</h3>
                  )}
                  <span className="task-count">{columnTasks.length}</span>
                </div>

                <div className="column-actions">
                  <button
                    className="column-menu-btn"
                    onClick={() => setColumnMenuOpen(columnMenuOpen === column._id ? null : column._id)}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {columnMenuOpen === column._id && (
                    <div className="column-menu">
                      <button onClick={() => {
                        setEditingColumn(column._id);
                        setColumnMenuOpen(null);
                      }}>
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button onClick={() => {
                        handleDeleteColumn(column._id);
                        setColumnMenuOpen(null);
                      }} className="delete-option">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="column-tasks">
                <AnimatePresence>
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="kanban-task"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={() => setShowRemoveZone(false)}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="task-drag-handle">
                        <GripVertical size={16} />
                      </div>

                      <div className="task-content">
                        <div className="task-header-row">
                          <span className="task-icon">{task.icon}</span>
                          <div
                            className="task-priority-dot"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          ></div>
                        </div>

                        <h4 className="task-title">{task.text}</h4>

                        {task.notes && (
                          <p className="task-notes">{task.notes.substring(0, 80)}{task.notes.length > 80 ? '...' : ''}</p>
                        )}

                        <div className="task-footer">
                          {task.category && (
                            <span className="task-category">{task.category.name}</span>
                          )}
                          {task.xp && (
                            <span className="task-xp">{task.xp} XP</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  className="add-task-to-column-btn"
                  onClick={() => {
                    setSelectedColumnForTask(column);
                    setShowTaskSelector(true);
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        <button className="add-column-btn-side" onClick={() => setShowAddColumn(true)}>
          <Plus size={24} />
        </button>
      </div>

      {/* Add Column Modal */}
      <AnimatePresence>
        {showAddColumn && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddColumn(false)}
            />
            <motion.div
              className="modal add-column-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h3>Add New Column</h3>
                <button className="close-btn" onClick={() => setShowAddColumn(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddColumn} className="modal-form">
                <div className="form-group">
                  <label>Column Name</label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="e.g., Review, Testing"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={newColumnColor}
                    onChange={(e) => setNewColumnColor(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddColumn(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Column
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Selector Modal */}
      <AnimatePresence>
        {showTaskSelector && selectedColumnForTask && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskSelector(false)}
            />
            <motion.div
              className="modal task-selector-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h3>Add Task to {selectedColumnForTask.name}</h3>
                <button className="close-btn" onClick={() => setShowTaskSelector(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="task-selector-list">
                {tasks
                  .filter(t => !t.kanbanColumnId)
                  .map(task => (
                    <div
                      key={task._id}
                      className="task-selector-item"
                      onClick={async () => {
                        try {
                          await fetch(`${API_URL}/api/tasks/${task._id}`, {
                            method: 'PATCH',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ kanbanColumnId: selectedColumnForTask._id })
                          });
                          onTaskUpdate();
                          setShowTaskSelector(false);
                        } catch (error) {
                          console.error('Error adding task to column:', error);
                        }
                      }}
                    >
                      <span className="task-selector-icon">{task.icon}</span>
                      <div className="task-selector-content">
                        <div className="task-selector-title">
                          {task.parentId && <span className="subtask-indicator">↳ </span>}
                          {task.text}
                        </div>
                        {task.category && (
                          <span className="task-selector-category">{task.category.name}</span>
                        )}
                      </div>
                      <div
                        className="task-selector-priority"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      ></div>
                    </div>
                  ))}
                {tasks.filter(t => !t.kanbanColumnId).length === 0 && (
                  <div className="no-tasks-message">
                    No available tasks. All tasks are already in Kanban columns.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove Zone */}
      {showRemoveZone && (
        <motion.div
          className={`remove-zone ${trashHovered ? 'hovered' : ''}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setTrashHovered(true);
          }}
          onDragLeave={() => setTrashHovered(false)}
          onDrop={handleRemoveFromColumn}
        >
          <div className="trash-icon-wrapper">
            <Trash2 size={48} className="trash-icon" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default KanbanBoard;
