import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Calendar, Settings as SettingsIcon, BarChart3,
  Trophy, Plus, X, Bell, LogOut, Edit2, Trash2, Check,
  Clock, Target, TrendingUp, Award, Menu, Moon, Sun, Repeat,
  ChevronDown, ChevronRight, ListTree, List, FileText
} from 'lucide-react';
import Auth from './components/Auth';
import CalendarView from './components/Calendar';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import UserProfile from './components/UserProfile';
import './App.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskIcon, setNewTaskIcon] = useState('📝');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskDeadlineDate, setNewTaskDeadlineDate] = useState('');
  const [newTaskDeadlineTime, setNewTaskDeadlineTime] = useState('');
  const [newTaskRecurring, setNewTaskRecurring] = useState(false);
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState('daily');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState(null);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [previousPage, setPreviousPage] = useState('dashboard');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [routines, setRoutines] = useState([]);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineIcon, setNewRoutineIcon] = useState('📋');
  const [newRoutineTasks, setNewRoutineTasks] = useState([]);
  const [showTaskSelectionModal, setShowTaskSelectionModal] = useState(false);
  const [selectedTasksForRoutine, setSelectedTasksForRoutine] = useState([]);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [quickNoteCategory, setQuickNoteCategory] = useState(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [newTaskXP, setNewTaskXP] = useState(null);
  const [newTaskType, setNewTaskType] = useState('simple'); // simple, deadline, recurring, progress
  const [toast, setToast] = useState(null);
  const [newTaskProgressTarget, setNewTaskProgressTarget] = useState(100);
  const [newTaskProgressUnit, setNewTaskProgressUnit] = useState('pages');
  const [newTaskProgressXPPerUnit, setNewTaskProgressXPPerUnit] = useState(1);
  const [newTaskProgressUnitInterval, setNewTaskProgressUnitInterval] = useState(10);
  const [isIncrementSubtask, setIsIncrementSubtask] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(10);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchCategories();
      fetchRoutines();
    }
  }, [token]);

  // Ensure newTaskCategory is always valid when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === newTaskCategory);
      if (!categoryExists) {
        console.log(`Category "${newTaskCategory}" no longer exists, updating to "${categories[0].name}"`);
        setNewTaskCategory(categories[0].name);
      }
    }
  }, [categories]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);

        // Set category to first available if:
        // 1. No category is selected yet, OR
        // 2. Current selected category no longer exists
        if (data.length > 0) {
          const categoryExists = data.some(cat => cat.name === newTaskCategory);
          if (!newTaskCategory || !categoryExists) {
            setNewTaskCategory(data[0].name);
          }
        } else {
          // No categories available
          setNewTaskCategory('');
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRoutines = async () => {
    try {
      const response = await fetch(`${API_URL}/api/routines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoutines(data);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const calculateXP = (priority) => {
    const xpValues = { low: 25, medium: 50, high: 100, critical: 200 };
    return xpValues[priority] || 50;
  };

  const handleIncrementButton = async (subtask) => {
    const parentTask = tasks.find(t => t._id === subtask.parentId);
    if (!parentTask || !parentTask.progressTracking || !parentTask.progressTracking.enabled) return;

    const newValue = Math.min(
      parentTask.progressTracking.current + subtask.incrementAmount,
      parentTask.progressTracking.target
    );

    await updateTaskProgress(parentTask._id, newValue);
  };

  const updateTaskProgress = async (taskId, newValue) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || !task.progressTracking) return;

    const oldPercent = Math.floor((task.progressTracking.current / task.progressTracking.target) * 100);
    const newPercent = Math.floor((newValue / task.progressTracking.target) * 100);

    // Check if we crossed a 10% milestone
    const oldMilestone = Math.floor(oldPercent / 10);
    const newMilestone = Math.floor(newPercent / 10);

    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'progressTracking.current': newValue
        })
      });

      if (response.ok) {
        // Award XP based on units completed
        const unitsCompleted = newValue - task.progressTracking.current;
        let totalXP = 0;

        if (task.progressTracking.xpPerUnit && task.progressTracking.unitInterval) {
          // Award XP for each interval completed
          const intervalsCompleted = Math.floor(unitsCompleted / task.progressTracking.unitInterval);
          totalXP = intervalsCompleted * task.progressTracking.xpPerUnit;
        }

        if (totalXP > 0) {

          // Update user XP
          let newXP = user.xp + totalXP;
          let newLevel = user.level;
          let newXpToNext = user.xpToNextLevel;

          while (newXP >= newXpToNext) {
            newXP -= newXpToNext;
            newLevel++;
            newXpToNext = Math.floor(newXpToNext * 1.5);
          }

          const updatedUser = {
            ...user,
            level: newLevel,
            xp: newXP,
            totalPoints: user.totalPoints + totalXP,
            xpToNextLevel: newXpToNext
          };

          // Update user stats on server
          await fetch(`${API_URL}/api/user/stats`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              level: updatedUser.level,
              xp: updatedUser.xp,
              totalPoints: updatedUser.totalPoints,
              xpToNextLevel: updatedUser.xpToNextLevel
            })
          });

          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Show XP notification
          setToast({
            message: `+${totalXP} XP (${newValue}/${task.progressTracking.target} ${task.progressTracking.unit})`,
            type: 'success'
          });
          setTimeout(() => setToast(null), 3000);
        }

        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const completeTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.completed) return;

    // Calculate XP based on progress if tracking is enabled
    let xpGained = task.xp || calculateXP(task.priority);
    if (task.progressTracking && task.progressTracking.enabled) {
      const progressPercent = task.progressTracking.current / task.progressTracking.target;
      xpGained = Math.floor(xpGained * progressPercent);
    }
    let newXP = user.xp + xpGained;
    let newLevel = user.level;
    let newXpToNext = user.xpToNextLevel;

    while (newXP >= newXpToNext) {
      newXP -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.5);
    }

    const updatedUser = {
      ...user,
      level: newLevel,
      xp: newXP,
      totalPoints: user.totalPoints + xpGained,
      xpToNextLevel: newXpToNext
    };

    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: true, completedAt: new Date() })
      });

      await fetch(`${API_URL}/api/user/stats`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: newLevel,
          xp: newXP,
          totalPoints: updatedUser.totalPoints,
          xpToNextLevel: newXpToNext
        })
      });

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const addTask = async () => {
    console.log('addTask called');
    console.log('newTaskText:', newTaskText);
    console.log('newTaskCategory:', newTaskCategory);
    console.log('available categories:', categories.map(c => c.name));
    console.log('newTaskDeadline:', newTaskDeadline);
    console.log('newTaskDeadlineDate:', newTaskDeadlineDate);
    console.log('newTaskDeadlineTime:', newTaskDeadlineTime);

    if (!newTaskText.trim()) return;

    const categoryData = categories.find(c => c.name === newTaskCategory);

    if (!categoryData) {
      alert(`Category "${newTaskCategory}" does not exist. Please select a valid category.`);
      return;
    }

    // Convert deadline to ISO format - support both datetime-local and separate date/time
    let deadlineISO = null;
    if (newTaskDeadline) {
      // Using datetime-local input
      deadlineISO = new Date(newTaskDeadline).toISOString();
    } else if (newTaskDeadlineDate) {
      // Using separate date and time inputs
      if (newTaskDeadlineTime) {
        // Date + Time
        deadlineISO = new Date(`${newTaskDeadlineDate}T${newTaskDeadlineTime}`).toISOString();
      } else {
        // Date only - set time to end of day (23:59:59)
        deadlineISO = new Date(`${newTaskDeadlineDate}T23:59:59`).toISOString();
      }
    }
    console.log('deadlineISO:', deadlineISO);

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newTaskText,
          priority: newTaskPriority,
          icon: newTaskIcon,
          category: newTaskCategory,
          categoryColor: categoryData?.color || '#3b82f6',
          taskType: newTaskType,
          deadline: (newTaskType === 'deadline' || newTaskType === 'recurring') ? deadlineISO : null,
          recurring: newTaskType === 'recurring',
          recurrenceType: newTaskType === 'recurring' ? newTaskRecurrenceType : null,
          notes: newTaskNotes,
          blocksDevice: null,
          progress: 0,
          xp: newTaskXP,
          progressTracking: newTaskType === 'progress' ? {
            enabled: true,
            current: 0,
            target: newTaskProgressTarget,
            unit: newTaskProgressUnit,
            xpPerUnit: newTaskProgressXPPerUnit,
            unitInterval: newTaskProgressUnitInterval
          } : null
        })
      });

      if (response.ok) {
        setNewTaskText('');
        setNewTaskIcon('📝');
        setNewTaskDeadline('');
        setNewTaskDeadlineDate('');
        setNewTaskDeadlineTime('');
        setNewTaskRecurring(false);
        setNewTaskRecurrenceType('daily');
        setNewTaskNotes('');
        setNewTaskXP(null);
        setNewTaskType('simple');
        setNewTaskProgressTarget(100);
        setNewTaskProgressUnit('pages');
        setNewTaskProgressXPPerUnit(1);
        setNewTaskProgressUnitInterval(10);
        setShowAddTask(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditTask(true);
  };

  const updateTask = async () => {
    console.log('updateTask called');
    console.log('editingTask:', editingTask);

    if (!editingTask || !editingTask.text.trim()) return;

    const categoryData = categories.find(c => c.name === editingTask.category);

    // Convert deadline to ISO format
    let deadlineISO = null;
    if (editingTask.deadline) {
      // Check if it's already an ISO string or needs conversion
      if (typeof editingTask.deadline === 'string' && editingTask.deadline.includes('Z')) {
        // Already ISO format
        deadlineISO = editingTask.deadline;
      } else {
        // Convert to ISO
        deadlineISO = new Date(editingTask.deadline).toISOString();
      }
    }
    console.log('deadlineISO:', deadlineISO);

    try {
      const response = await fetch(`${API_URL}/api/tasks/${editingTask._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: editingTask.text,
          priority: editingTask.priority,
          icon: editingTask.icon,
          category: editingTask.category,
          categoryColor: categoryData?.color || editingTask.categoryColor,
          deadline: deadlineISO,
          recurring: editingTask.recurring,
          recurrenceType: editingTask.recurring ? editingTask.recurrenceType : null,
          notes: editingTask.notes || '',
          xp: editingTask.xp
        })
      });

      if (response.ok) {
        setShowEditTask(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setTasks([]);
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setActivePage('category');
    setSidebarOpen(false);
  };

  const handleEditCategory = (e, category) => {
    e.stopPropagation();
    setEditingCategory(category);
    setShowEditCategory(true);
  };

  const handleDeleteCategory = async (e, categoryId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchCategories();
        if (selectedCategory?._id === categoryId || selectedCategory?.id === categoryId) {
          setSelectedCategory(null);
          setActivePage('dashboard');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete category: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const updateCategory = async () => {
    if (!editingCategory.name || !editingCategory.icon) return;

    try {
      const response = await fetch(`${API_URL}/api/categories/${editingCategory._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingCategory.name,
          icon: editingCategory.icon,
          color: editingCategory.color
        })
      });

      if (response.ok) {
        await fetchCategories();
        await fetchTasks(); // Refresh tasks to show updated category names
        setShowEditCategory(false);
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName || !newCategoryIcon) return;

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName,
          icon: newCategoryIcon,
          color: newCategoryColor
        })
      });

      if (response.ok) {
        await fetchCategories();
        setShowAddCategory(false);
        setNewCategoryName('');
        setNewCategoryIcon('📁');
        setNewCategoryColor('#3b82f6');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const saveRoutine = async () => {
    if (!newRoutineName.trim() || newRoutineTasks.length === 0) return;

    try {
      if (editingRoutine) {
        // Update existing routine
        const response = await fetch(`${API_URL}/api/routines/${editingRoutine._id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newRoutineName,
            icon: newRoutineIcon,
            tasks: newRoutineTasks
          })
        });

        if (response.ok) {
          await fetchRoutines();
          setActivePage('routines');
          setEditingRoutine(null);
          setNewRoutineName('');
          setNewRoutineIcon('📋');
          setNewRoutineTasks([]);
        }
      } else {
        // Create new routine
        const response = await fetch(`${API_URL}/api/routines`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newRoutineName,
            icon: newRoutineIcon,
            tasks: newRoutineTasks.map(t => ({ text: t.text, completed: false }))
          })
        });

        if (response.ok) {
          await fetchRoutines();
          setActivePage('routines');
          setNewRoutineName('');
          setNewRoutineIcon('📋');
          setNewRoutineTasks([]);
        }
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const deleteRoutine = async (routineId) => {
    try {
      const response = await fetch(`${API_URL}/api/routines/${routineId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRoutines();
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const completeRoutineTask = async (routineId, taskIndex) => {
    try {
      const response = await fetch(`${API_URL}/api/routines/${routineId}/complete/${taskIndex}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRoutines();
      }
    } catch (error) {
      console.error('Error completing routine task:', error);
    }
  };

  const resetRoutine = async (routineId) => {
    try {
      const response = await fetch(`${API_URL}/api/routines/${routineId}/reset`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchRoutines();
      }
    } catch (error) {
      console.error('Error resetting routine:', error);
    }
  };

  const handleAddTasksToRoutine = () => {
    setShowTaskSelectionModal(true);
    // Pre-select already selected tasks
    setSelectedTasksForRoutine(newRoutineTasks.map(t => t.text));
  };

  const handleTaskToggleForRoutine = (taskText) => {
    setSelectedTasksForRoutine(prev => {
      if (prev.includes(taskText)) {
        return prev.filter(t => t !== taskText);
      } else {
        return [...prev, taskText];
      }
    });
  };

  const handleConfirmTaskSelection = () => {
    // Convert selected task texts to task objects, preserving order for existing tasks
    const existingTasksMap = new Map(newRoutineTasks.map(t => [t.text, t]));
    const updatedTasks = [];

    // First add existing tasks that are still selected (preserve order)
    newRoutineTasks.forEach(task => {
      if (selectedTasksForRoutine.includes(task.text)) {
        updatedTasks.push(task);
      }
    });

    // Then add new tasks
    selectedTasksForRoutine.forEach(taskText => {
      if (!existingTasksMap.has(taskText)) {
        updatedTasks.push({ text: taskText, completed: false });
      }
    });

    setNewRoutineTasks(updatedTasks);
    setShowTaskSelectionModal(false);
    setSelectedTasksForRoutine([]);
  };

  const removeRoutineTask = (index) => {
    setNewRoutineTasks(newRoutineTasks.filter((_, i) => i !== index));
  };

  const moveRoutineTask = (index, direction) => {
    const newTasks = [...newRoutineTasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newTasks.length) return;
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    setNewRoutineTasks(newTasks);
  };

  const handleQuickNote = (category) => {
    setQuickNoteCategory(category);
    setQuickNoteText('');
    setShowQuickNoteModal(true);
  };

  const saveQuickNote = async () => {
    if (!quickNoteText.trim() || !quickNoteCategory) return;

    const categoryData = categories.find(c => c.name === quickNoteCategory.name);

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: quickNoteText,
          priority: 'low',
          icon: '📝',
          category: quickNoteCategory.name,
          categoryColor: categoryData?.color || '#3b82f6',
          deadline: null,
          recurring: false,
          recurrenceType: null,
          notes: '',
          parentId: null,
          blocksDevice: null,
          progress: 0
        })
      });

      if (response.ok) {
        await fetchTasks();
        setShowQuickNoteModal(false);
        setQuickNoteText('');
        setQuickNoteCategory(null);
      }
    } catch (error) {
      console.error('Error saving quick note:', error);
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleAddSubtask = (parentTask) => {
    setParentTaskForSubtask(parentTask);
    setNewTaskText('');
    setNewTaskIcon('📝');
    setNewTaskPriority(parentTask.priority);
    setNewTaskCategory(parentTask.category);
    setNewTaskDeadline('');
    setNewTaskRecurring(false);
    setNewTaskRecurrenceType('daily');
    setShowAddSubtask(true);
  };

  const addSubtask = async () => {
    if (!newTaskText.trim() || !parentTaskForSubtask) return;

    const categoryData = categories.find(c => c.name === newTaskCategory);

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newTaskText,
          priority: newTaskPriority,
          icon: newTaskIcon,
          category: newTaskCategory,
          categoryColor: categoryData?.color || '#3b82f6',
          deadline: newTaskDeadline || null,
          recurring: newTaskRecurring,
          recurrenceType: newTaskRecurring ? newTaskRecurrenceType : null,
          notes: newTaskNotes,
          parentId: parentTaskForSubtask._id,
          blocksDevice: null,
          progress: 0,
          isIncrementButton: isIncrementSubtask,
          incrementAmount: isIncrementSubtask ? incrementAmount : null
        })
      });

      if (response.ok) {
        setNewTaskText('');
        setNewTaskIcon('📝');
        setNewTaskDeadline('');
        setNewTaskRecurring(false);
        setNewTaskRecurrenceType('daily');
        setNewTaskNotes('');
        setIsIncrementSubtask(false);
        setIncrementAmount(10);
        setShowAddSubtask(false);
        setParentTaskForSubtask(null);
        fetchTasks();
        // Auto-expand parent task to show new subtask
        setExpandedTasks(prev => ({ ...prev, [parentTaskForSubtask._id]: true }));
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const getSubtasks = (parentId) => {
    return tasks.filter(t => t.parentId === parentId);
  };

  const getSubtaskProgress = (parentId) => {
    const subtasks = getSubtasks(parentId);
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(t => t.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    // Only save previous page if we're not already on task-detail
    if (activePage !== 'task-detail') {
      console.log('Saving previous page:', activePage);
      setPreviousPage(activePage);
    }
    setActivePage('task-detail');
  };

  const handleBackFromTaskDetail = () => {
    console.log('Going back to:', previousPage);
    console.log('Selected category:', selectedCategory);

    // Navigate back
    setActivePage(previousPage);

    // If we were in a category view, make sure it's still selected
    if (previousPage === 'category' && selectedCategory) {
      // Category is already selected, just changing page
      console.log('Returning to category:', selectedCategory.name);
    }
  };

  const toggleCategoryExpansion = (e, categoryId) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getCategoryTasks = (categoryName) => {
    return tasks.filter(t => t.category === categoryName && !t.parentId && !t.completed);
  };

  const taskIcons = ['📝', '💼', '🏠', '❤️', '📚', '🎯', '🏋️', '🍎', '💰', '🎨', '🎮', '📱'];
  const categoryIcons = ['📁', '💼', '🏠', '❤️', '📚', '🎯', '🏋️', '🍎', '💰', '🎨', '🎮', '📱', '✈️', '🎭', '🎸', '⚽', '🎬', '📷', '🔧', '💡', '🌟', '🔥', '⚡', '🌈'];

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Filter out subtasks from main lists
  const mainTasks = tasks.filter(t => !t.parentId);
  const activeTasks = mainTasks.filter(t => !t.completed);
  const completedTasks = mainTasks.filter(t => t.completed);
  const completedCount = completedTasks.length;
  const totalCount = mainTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const progressPercentage = user.xpToNextLevel > 0 ? Math.round((user.xp / user.xpToNextLevel) * 100) : 0;

  let filteredTasks = activeTasks;
  if (activePage === 'tasks') {
    filteredTasks = activeFilter === 'all' ? activeTasks :
                    activeFilter === 'completed' ? completedTasks :
                    activeTasks.filter(t => t.priority === activeFilter);
  } else if (activePage === 'category' && selectedCategory) {
    filteredTasks = activeTasks.filter(t => t.category === selectedCategory.name);
  }

  const getPageTitle = () => {
    if (activePage === 'dashboard') return 'Dashboard';
    if (activePage === 'tasks') return 'All Tasks';
    if (activePage === 'calendar') return 'Calendar';
    if (activePage === 'analytics') return 'Analytics';
    if (activePage === 'settings') return 'Settings';
    if (activePage === 'notifications') return 'Notifications';
    if (activePage === 'profile') return 'Profile';
    if (activePage === 'category' && selectedCategory) return selectedCategory.name;
    return 'Dashboard';
  };

  const renderContent = () => {
    if (activePage === 'calendar') {
      return <CalendarView tasks={tasks} />;
    }

    if (activePage === 'analytics') {
      return <Analytics tasks={tasks} categories={categories} user={user} />;
    }

    if (activePage === 'settings') {
      return <Settings user={user} />;
    }

    if (activePage === 'notifications') {
      return <Notifications />;
    }

    if (activePage === 'add-routine' || activePage === 'edit-routine') {
      return (
        <div className="add-routine-page">
          <div className="routine-form-header">
            <button
              className="back-btn"
              onClick={() => {
                setActivePage('routines');
                setEditingRoutine(null);
                setNewRoutineName('');
                setNewRoutineIcon('📋');
                setNewRoutineTasks([]);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              ← Back
            </button>
            <h2 className="section-title">
              {activePage === 'edit-routine' ? 'Edit Routine' : 'Add New Routine'}
            </h2>
          </div>

          <div className="routine-form-content">
            <div className="form-group">
              <label className="form-label">Routine Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Morning routine, Study routine, etc."
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Routine Icon</label>
              <div className="icon-grid">
                {categoryIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${newRoutineIcon === icon ? 'active' : ''}`}
                    onClick={() => setNewRoutineIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tasks (in order)</label>

              {newRoutineTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--text-tertiary)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '2px dashed rgba(255, 255, 255, 0.1)',
                  marginBottom: '1rem'
                }}>
                  No tasks selected. Click "Add Tasks" to select tasks.
                </div>
              ) : (
                <div className="routine-tasks-list">
                  {newRoutineTasks.map((task, index) => (
                    <div key={index} className="routine-task-item-edit">
                      <div className="task-order">{index + 1}</div>
                      <span className="task-text">{task.text}</span>
                      <div className="task-actions">
                        <button
                          className="move-btn"
                          onClick={() => moveRoutineTask(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="move-btn"
                          onClick={() => moveRoutineTask(index, 'down')}
                          disabled={index === newRoutineTasks.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          className="delete-task-btn"
                          onClick={() => removeRoutineTask(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="add-tasks-btn" onClick={handleAddTasksToRoutine}>
                <Plus size={18} />
                Add Tasks
              </button>
            </div>
          </div>

          <button
            className="submit-btn"
            onClick={saveRoutine}
            disabled={!newRoutineName.trim() || newRoutineTasks.length === 0}
            style={{
              marginTop: '2rem',
              opacity: (!newRoutineName.trim() || newRoutineTasks.length === 0) ? 0.5 : 1,
              cursor: (!newRoutineName.trim() || newRoutineTasks.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {activePage === 'edit-routine' ? 'Update Routine' : 'Create Routine'}
          </button>
        </div>
      );
    }

    if (activePage === 'routines') {
      return (
        <div className="routines-page">
          <div className="section-header">
            <h2 className="section-title">
              <List size={20} />
              Your Routines
            </h2>
            <button
              className="add-task-btn"
              onClick={() => {
                setEditingRoutine(null);
                setNewRoutineName('');
                setNewRoutineIcon('📋');
                setNewRoutineTasks([]);
                setActivePage('add-routine');
              }}
            >
              <Plus size={20} />
              Add Routine
            </button>
          </div>

          <div className="routines-list">
            {routines.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                No routines found. Create your first routine!
              </div>
            )}
            {routines.map((routine) => {
              const completedTasks = routine.tasks.filter(t => t.completed).length;
              const totalTasks = routine.tasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              const currentTaskIndex = routine.tasks.findIndex(t => !t.completed);

              return (
                <motion.div
                  key={routine._id}
                  className="routine-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="routine-header">
                    <div className="routine-title-section">
                      <span style={{ fontSize: '2rem' }}>{routine.icon}</span>
                      <h3>{routine.name}</h3>
                    </div>
                    <div className="routine-actions">
                      <button
                        className="icon-btn"
                        onClick={() => {
                          setEditingRoutine(routine);
                          setNewRoutineName(routine.name);
                          setNewRoutineIcon(routine.icon);
                          setNewRoutineTasks(routine.tasks);
                          setActivePage('edit-routine');
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this routine?')) {
                            deleteRoutine(routine._id);
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="routine-progress">
                    <div className="progress-text">
                      {completedTasks} of {totalTasks} tasks completed
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="routine-tasks">
                    {routine.tasks.map((task, index) => {
                      const isCurrentTask = index === currentTaskIndex;
                      const canComplete = index === 0 || routine.tasks[index - 1].completed;

                      return (
                        <div
                          key={index}
                          className={`routine-task-item ${task.completed ? 'completed' : ''} ${isCurrentTask ? 'current' : ''} ${!canComplete ? 'locked' : ''}`}
                        >
                          <div className="routine-task-number">{index + 1}</div>
                          <div
                            className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                            onClick={() => canComplete && !task.completed && completeRoutineTask(routine._id, index)}
                            style={{ cursor: canComplete && !task.completed ? 'pointer' : 'not-allowed', opacity: canComplete ? 1 : 0.5 }}
                          >
                            {task.completed && <Check size={16} />}
                          </div>
                          <span style={{ flex: 1, opacity: task.completed ? 0.6 : 1, textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.text}
                          </span>
                          {!canComplete && index > 0 && (
                            <span className="locked-badge">Locked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {completedTasks === totalTasks && totalTasks > 0 && (
                    <button
                      className="reset-routine-btn"
                      onClick={() => resetRoutine(routine._id)}
                    >
                      <Repeat size={18} />
                      Reset Routine
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activePage === 'task-detail' && selectedTask) {
      return (
        <div className="task-detail-page">
          <div className="task-detail-header">
            <button
              className="back-btn"
              onClick={handleBackFromTaskDetail}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              ← Back
            </button>
          </div>

          <div className="task-detail-content">
            <div className="task-detail-title-section">
              <span style={{ fontSize: '3rem' }}>{selectedTask.icon}</span>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {selectedTask.text}
                </h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="task-category">{selectedTask.category}</span>
                  <span className={`task-priority ${selectedTask.priority}`}>
                    {selectedTask.priority}
                  </span>
                  {selectedTask.recurring && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6', fontSize: '0.95rem', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 12px', borderRadius: '6px' }}>
                      <Repeat size={16} />
                      {selectedTask.recurrenceType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="task-detail-grid">
              <div className="task-info-card">
                <div className="task-info-label">Status</div>
                <div className="task-info-value">
                  {selectedTask.completed ? '✅ Completed' : '⏳ In Progress'}
                </div>
              </div>

              {selectedTask.deadline && (
                <div className="task-info-card">
                  <div className="task-info-label">Deadline</div>
                  <div className="task-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} />
                    {new Date(selectedTask.deadline).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="task-info-card">
                <div className="task-info-label">Created</div>
                <div className="task-info-value">
                  {new Date(selectedTask.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedTask.completedAt && (
                <div className="task-info-card">
                  <div className="task-info-label">Completed</div>
                  <div className="task-info-value">
                    {new Date(selectedTask.completedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {selectedTask.notes && (
              <div className="task-notes-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📝 Notes
                </h3>
                <div className="task-notes-content">
                  {selectedTask.notes}
                </div>
              </div>
            )}

            {getSubtasks(selectedTask._id).length > 0 && (
              <div className="task-subtasks-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 Subtasks ({getSubtasks(selectedTask._id).filter(t => t.completed).length}/{getSubtasks(selectedTask._id).length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getSubtasks(selectedTask._id).map(subtask => (
                    <div
                      key={subtask._id}
                      className="subtask-detail-item"
                      onClick={() => handleTaskClick(subtask)}
                    >
                      <div
                        className={`task-checkbox ${subtask.completed ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          !subtask.completed && completeTask(subtask._id);
                        }}
                        style={{ flexShrink: 0 }}
                      >
                        {subtask.completed && <Check size={14} style={{ color: 'var(--text-on-accent)' }} />}
                      </div>
                      <span style={{ fontSize: '1.5rem' }}>{subtask.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{subtask.text}</div>
                        {subtask.notes && (
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {subtask.notes.substring(0, 150)}{subtask.notes.length > 150 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <span className={`task-priority ${subtask.priority}`}>
                        {subtask.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="task-actions-section">
              <button
                className="task-action-button edit"
                onClick={() => {
                  handleBackFromTaskDetail();
                  handleEditTask(selectedTask);
                }}
              >
                <Edit2 size={18} />
                Edit Task
              </button>
              {!selectedTask.completed && (
                <button
                  className="task-action-button complete"
                  onClick={() => {
                    completeTask(selectedTask._id);
                    handleBackFromTaskDetail();
                  }}
                >
                  <Check size={18} />
                  Complete Task
                </button>
              )}
              <button
                className="task-action-button delete"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(selectedTask._id);
                    handleBackFromTaskDetail();
                  }
                }}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 'profile') {
      return (
        <UserProfile
          user={user}
          token={token}
          onLogout={handleLogout}
          onUpdateUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }}
        />
      );
    }

    return (
      <div className="tasks-section">
        <div className="section-header">
          <h2 className="section-title">
            <CheckSquare size={20} />
            {activePage === 'category' && selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name} Tasks` : 'Your Tasks'}
          </h2>
          {activePage === 'tasks' && (
            <div className="task-filters">
              <button
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${activeFilter === 'high' ? 'active' : ''}`}
                onClick={() => setActiveFilter('high')}
              >
                High Priority
              </button>
              <button
                className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveFilter('completed')}
              >
                Completed
              </button>
            </div>
          )}
        </div>

        <div className="task-list">
          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              No tasks found. Create your first task!
            </div>
          )}
          {filteredTasks.map((task) => {
            const subtasks = getSubtasks(task._id);
            const hasSubtasks = subtasks.length > 0;
            const isExpanded = expandedTasks[task._id];
            const subtaskProgress = getSubtaskProgress(task._id);

            return (
              <div key={task._id}>
                <motion.div
                  className="task-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {hasSubtasks && (
                    <button
                      className="task-expand-btn"
                      onClick={() => toggleTaskExpansion(task._id)}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                  <div
                    className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                    onClick={() => !task.completed && completeTask(task._id)}
                    style={{ marginLeft: hasSubtasks ? '0' : '24px' }}
                  >
                    {task.completed && <Check size={14} style={{ color: 'var(--text-on-accent)' }} />}
                  </div>
                  <span className="task-icon">{task.icon}</span>
                  <div className="task-content" onClick={() => handleTaskClick(task)} style={{ cursor: 'pointer' }}>
                    <div className="task-text">
                      {task.text}
                      {hasSubtasks && (
                        <span className="subtask-count">{subtasks.filter(t => t.completed).length}/{subtasks.length}</span>
                      )}
                      {task.progressTracking && task.progressTracking.enabled && (
                        <span className="progress-badge">
                          {task.progressTracking.current}/{task.progressTracking.target} {task.progressTracking.unit}
                        </span>
                      )}
                    </div>
                    <div className="task-meta">
                      <span className="task-category">{task.category}</span>
                      <span className={`task-priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.deadline && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {task.recurring && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6' }}>
                          <Repeat size={12} />
                          {task.recurrenceType}
                        </span>
                      )}
                    </div>
                    {task.progressTracking && task.progressTracking.enabled && !task.completed && (
                      <div className="progress-tracker" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="progress-increment-btn"
                          onClick={() => {
                            const newVal = Math.min(
                              task.progressTracking.current + 10,
                              task.progressTracking.target
                            );
                            updateTaskProgress(task._id, newVal);
                          }}
                        >
                          +10 {task.progressTracking.unit}
                        </button>
                      </div>
                    )}
                  </div>
                  {!task.completed && (
                    <div className="task-progress">
                      <div className="progress-bar-small">
                        <div
                          className="progress-fill-small"
                          style={{
                            width: `${
                              hasSubtasks
                                ? subtaskProgress
                                : task.progressTracking && task.progressTracking.enabled
                                  ? Math.round((task.progressTracking.current / task.progressTracking.target) * 100)
                                  : (task.progress || 0)
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {
                          hasSubtasks
                            ? subtaskProgress
                            : task.progressTracking && task.progressTracking.enabled
                              ? Math.round((task.progressTracking.current / task.progressTracking.target) * 100)
                              : (task.progress || 0)
                        }%
                      </span>
                    </div>
                  )}
                  <div className="task-actions">
                    {!task.completed && (
                      <button
                        className="task-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSubtask(task);
                        }}
                        title="Add subtask"
                      >
                        <ListTree size={14} />
                      </button>
                    )}
                    <button
                      className="task-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="task-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task._id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>

                {/* Render Subtasks */}
                {isExpanded && hasSubtasks && (
                  <div className="subtask-list">
                    {subtasks.map((subtask) => (
                      <motion.div
                        key={subtask._id}
                        className={`task-item subtask-item ${subtask.isIncrementButton ? 'increment-button-task' : ''}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {subtask.isIncrementButton ? (
                          // Render as increment button
                          <button
                            className="increment-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncrementButton(subtask);
                            }}
                          >
                            <span className="task-icon">{subtask.icon}</span>
                            <span className="increment-button-text">
                              {subtask.text}
                              <span className="increment-amount">+{subtask.incrementAmount}</span>
                            </span>
                            <Plus size={20} className="increment-icon" />
                          </button>
                        ) : (
                          // Render as normal subtask
                          <>
                            <div
                              className={`task-checkbox ${subtask.completed ? 'checked' : ''}`}
                              onClick={() => !subtask.completed && completeTask(subtask._id)}
                            >
                              {subtask.completed && <Check size={14} style={{ color: 'var(--text-on-accent)' }} />}
                            </div>
                            <span className="task-icon">{subtask.icon}</span>
                            <div className="task-content" onClick={() => handleTaskClick(subtask)} style={{ cursor: 'pointer' }}>
                              <div className="task-text">{subtask.text}</div>
                              <div className="task-meta">
                                <span className={`task-priority ${subtask.priority}`}>
                                  {subtask.priority}
                                </span>
                                {subtask.deadline && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {new Date(subtask.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="task-actions">
                              <button
                                className="task-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(subtask);
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="task-action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(subtask._id);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Trophy size={24} />
            <span>QuestMaster</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            <div
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
            <div
              className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
              onClick={() => handleNavClick('tasks')}
            >
              <CheckSquare size={18} />
              <span>Tasks</span>
              <span className="nav-item-badge">{activeTasks.length}</span>
            </div>
            <div
              className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
              onClick={() => handleNavClick('calendar')}
            >
              <Calendar size={18} />
              <span>Calendar</span>
            </div>
            <div
              className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`}
              onClick={() => handleNavClick('analytics')}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </div>
            <div
              className={`nav-item ${activePage === 'routines' ? 'active' : ''}`}
              onClick={() => handleNavClick('routines')}
            >
              <List size={18} />
              <span>Routines</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">
              Categories
              <button
                className="add-category-btn"
                onClick={() => setShowAddCategory(true)}
                title="Add new category"
              >
                <Plus size={16} />
              </button>
            </div>
            {categories.map(cat => {
              const categoryId = cat._id || cat.id;
              const isExpanded = expandedCategories[categoryId];
              const categoryTasks = getCategoryTasks(cat.name);
              const hasNonCompletedTasks = categoryTasks.length > 0;

              return (
                <div key={categoryId}>
                  <div
                    className={`nav-item category-nav-item ${activePage === 'category' && selectedCategory?.name === cat.name ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredCategory(categoryId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {hasNonCompletedTasks && (
                      <button
                        className="category-expand-btn"
                        onClick={(e) => toggleCategoryExpansion(e, categoryId)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, marginLeft: hasNonCompletedTasks ? '0' : '22px' }} onClick={() => handleCategoryClick(cat)}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {hasNonCompletedTasks && (
                        <span className="nav-item-badge">{categoryTasks.length}</span>
                      )}
                    </div>
                    {hoveredCategory === categoryId && (
                      <div className="category-actions">
                        <button
                          className="category-action-btn"
                          onClick={(e) => handleEditCategory(e, cat)}
                          title="Edit category"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="category-action-btn delete"
                          onClick={(e) => handleDeleteCategory(e, categoryId)}
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {isExpanded && hasNonCompletedTasks && (
                    <div className="category-tasks-list">
                      {categoryTasks.map(task => (
                        <div
                          key={task._id}
                          className="sidebar-task-item"
                          onClick={() => handleTaskClick(task)}
                        >
                          <span className="sidebar-task-icon">{task.icon}</span>
                          <span className="sidebar-task-text">{task.text}</span>
                        </div>
                      ))}
                      <button
                        className="add-note-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickNote(cat);
                        }}
                      >
                        <Plus size={14} />
                        <span>Add note</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="user-profile" onClick={() => handleNavClick('profile')}>
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-level">Level {user.level}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
          <div className="top-bar-actions">
            <button className="icon-btn" onClick={() => handleNavClick('notifications')}>
              <Bell size={20} />
            </button>
            <button className="icon-btn" onClick={() => handleNavClick('settings')}>
              <SettingsIcon size={20} />
            </button>
            <button className="add-task-btn" onClick={() => {
              // Ensure the category is valid before opening modal
              if (categories.length > 0) {
                const categoryExists = categories.some(cat => cat.name === newTaskCategory);
                if (!categoryExists) {
                  setNewTaskCategory(categories[0].name);
                }
              }
              setShowAddTask(true);
            }}>
              <Plus size={18} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activePage === 'dashboard' && (
            <>
              {/* Level Progress Card */}
              <div className="level-progress-card">
                <div className="level-header">
                  <div className="level-info">
                    <h3>Your Progress</h3>
                    <p className="level-xp">{user.xp} / {user.xpToNextLevel} XP</p>
                  </div>
                  <div className="level-badge">Level {user.level}</div>
                </div>
                <div className="progress-bar-wrapper">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon blue">
                      <Target size={24} />
                    </div>
                  </div>
                  <div className="stat-label">Active Tasks</div>
                  <div className="stat-value">{activeTasks.length}</div>
                  <div className="stat-change">+{activeTasks.length} this week</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon green">
                      <Check size={24} />
                    </div>
                  </div>
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{completedCount}</div>
                  <div className="stat-change">{completionPercentage}% completion rate</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon purple">
                      <Award size={24} />
                    </div>
                  </div>
                  <div className="stat-label">Total Points</div>
                  <div className="stat-value">{user.totalPoints}</div>
                  <div className="stat-change">
                    <TrendingUp size={14} style={{ marginRight: '4px' }} />
                    Growing
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon orange">
                      <Clock size={24} />
                    </div>
                  </div>
                  <div className="stat-label">Productivity</div>
                  <div className="stat-value">{Math.min(100, completionPercentage + 20)}%</div>
                  <div className="stat-change">Above average</div>
                </div>
              </div>
            </>
          )}

          {renderContent()}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddTask(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Create New Task</h2>
                <button className="close-btn" onClick={() => setShowAddTask(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Type</label>
                  <div className="task-type-selector">
                    <button
                      type="button"
                      className={`task-type-btn ${newTaskType === 'simple' ? 'active' : ''}`}
                      onClick={() => setNewTaskType('simple')}
                    >
                      <FileText size={18} />
                      Simple
                    </button>
                    <button
                      type="button"
                      className={`task-type-btn ${newTaskType === 'deadline' ? 'active' : ''}`}
                      onClick={() => setNewTaskType('deadline')}
                    >
                      <Calendar size={18} />
                      Deadline
                    </button>
                    <button
                      type="button"
                      className={`task-type-btn ${newTaskType === 'recurring' ? 'active' : ''}`}
                      onClick={() => setNewTaskType('recurring')}
                    >
                      <Repeat size={18} />
                      Recurring
                    </button>
                    <button
                      type="button"
                      className={`task-type-btn ${newTaskType === 'progress' ? 'active' : ''}`}
                      onClick={() => setNewTaskType('progress')}
                    >
                      <Target size={18} />
                      Track Progress
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Task Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What needs to be done?"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Task Icon</label>
                  <div className="icon-grid">
                    {taskIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${newTaskIcon === icon ? 'active' : ''}`}
                        onClick={() => setNewTaskIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat._id || cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newTaskType === 'progress' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Target Value</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 395 for pages"
                        value={newTaskProgressTarget}
                        onChange={(e) => setNewTaskProgressTarget(parseInt(e.target.value) || 100)}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-input"
                        value={newTaskProgressUnit}
                        onChange={(e) => setNewTaskProgressUnit(e.target.value)}
                      >
                        <option value="pages">pages</option>
                        <option value="€">€</option>
                        <option value="$">$</option>
                        <option value="£">£</option>
                        <option value="km">km</option>
                        <option value="hours">hours</option>
                        <option value="items">items</option>
                        <option value="%">%</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">XP Amount</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g., 5"
                          value={newTaskProgressXPPerUnit}
                          onChange={(e) => setNewTaskProgressXPPerUnit(parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Per N Units</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g., 10"
                          value={newTaskProgressUnitInterval}
                          onChange={(e) => setNewTaskProgressUnitInterval(parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                    </div>
                    <span className="form-hint">
                      Earn {newTaskProgressXPPerUnit} XP for every {newTaskProgressUnitInterval} {newTaskProgressUnit} completed
                    </span>
                  </>
                ) : (
                  <div className="form-group">
                    <label className="form-label">XP Reward (Optional)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={`Default: ${calculateXP(newTaskPriority)} XP`}
                      value={newTaskXP || ''}
                      onChange={(e) => setNewTaskXP(e.target.value ? parseInt(e.target.value) : null)}
                      min="1"
                      max="1000"
                    />
                    <span className="form-hint">
                      Leave empty to use default ({calculateXP(newTaskPriority)} XP based on priority)
                    </span>
                  </div>
                )}

                {(newTaskType === 'deadline' || newTaskType === 'recurring') && (
                  <div className="form-group">
                    <label className="form-label">{newTaskType === 'deadline' ? 'Deadline' : 'Start Date & Time'}</label>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <input
                          type="date"
                          className="form-input"
                          placeholder="Select date"
                          value={newTaskDeadlineDate}
                          onChange={(e) => setNewTaskDeadlineDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <input
                          type="time"
                          className="form-input"
                          placeholder="Time (optional)"
                          value={newTaskDeadlineTime}
                          onChange={(e) => setNewTaskDeadlineTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <span className="form-hint">Time is optional - tasks without time default to end of day</span>
                  </div>
                )}

                {newTaskType === 'recurring' && (
                  <div className="form-group">
                    <label className="form-label">Recurrence Pattern</label>
                    <select
                      className="form-input"
                      value={newTaskRecurrenceType}
                      onChange={(e) => setNewTaskRecurrenceType(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    placeholder="Add any additional details or notes..."
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    rows="4"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <button className="submit-btn" onClick={addTask}>
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {showEditTask && editingTask && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditTask(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Edit Task</h2>
                <button className="close-btn" onClick={() => setShowEditTask(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What needs to be done?"
                    value={editingTask.text}
                    onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && updateTask()}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Task Icon</label>
                  <div className="icon-grid">
                    {taskIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${editingTask.icon === icon ? 'active' : ''}`}
                        onClick={() => setEditingTask({ ...editingTask, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={editingTask.category}
                      onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat._id || cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">XP Reward (Optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={`Default: ${calculateXP(editingTask.priority)} XP`}
                    value={editingTask.xp || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, xp: e.target.value ? parseInt(e.target.value) : null })}
                    min="1"
                    max="1000"
                  />
                  <span className="form-hint">
                    Leave empty to use default ({calculateXP(editingTask.priority)} XP based on priority)
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline (Optional)</label>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <input
                        type="date"
                        className="form-input"
                        placeholder="Select date"
                        value={editingTask.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 10) : ''}
                        onChange={(e) => {
                          const currentTime = editingTask.deadline
                            ? new Date(editingTask.deadline).toISOString().slice(11, 16)
                            : '23:59';
                          if (e.target.value) {
                            setEditingTask({ ...editingTask, deadline: `${e.target.value}T${currentTime}` });
                          } else {
                            setEditingTask({ ...editingTask, deadline: null });
                          }
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <input
                        type="time"
                        className="form-input"
                        placeholder="Time (optional)"
                        value={editingTask.deadline ? new Date(editingTask.deadline).toISOString().slice(11, 16) : ''}
                        onChange={(e) => {
                          const currentDate = editingTask.deadline
                            ? new Date(editingTask.deadline).toISOString().slice(0, 10)
                            : '';
                          if (currentDate) {
                            const time = e.target.value || '23:59';
                            setEditingTask({ ...editingTask, deadline: `${currentDate}T${time}` });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <span className="form-hint">Time is optional - tasks without time default to end of day</span>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="editRecurring"
                      checked={editingTask.recurring || false}
                      onChange={(e) => setEditingTask({ ...editingTask, recurring: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="editRecurring" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Repeat size={16} />
                      Make this a recurring task
                    </label>
                  </div>
                </div>

                {editingTask.recurring && (
                  <div className="form-group">
                    <label className="form-label">Recurrence Pattern</label>
                    <select
                      className="form-input"
                      value={editingTask.recurrenceType || 'daily'}
                      onChange={(e) => setEditingTask({ ...editingTask, recurrenceType: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    placeholder="Add any additional details or notes..."
                    value={editingTask.notes || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    rows="4"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <button className="submit-btn" onClick={updateTask}>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Subtask Modal */}
      <AnimatePresence>
        {showAddSubtask && parentTaskForSubtask && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddSubtask(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  <ListTree size={20} />
                  Add Subtask
                </h2>
                <button className="close-btn" onClick={() => setShowAddSubtask(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="parent-task-info">
                  <span className="parent-task-label">Parent Task:</span>
                  <span className="parent-task-name">
                    <span>{parentTaskForSubtask.icon}</span>
                    {parentTaskForSubtask.text}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Subtask Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="What needs to be done?"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subtask Icon</label>
                  <div className="icon-grid">
                    {taskIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${newTaskIcon === icon ? 'active' : ''}`}
                        onClick={() => setNewTaskIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline (Optional)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    placeholder="Add any additional details or notes..."
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    rows="4"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {parentTaskForSubtask && parentTaskForSubtask.progressTracking && parentTaskForSubtask.progressTracking.enabled && (
                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        id="incrementSubtask"
                        checked={isIncrementSubtask}
                        onChange={(e) => setIsIncrementSubtask(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="incrementSubtask" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} />
                        Make this an increment button
                      </label>
                    </div>
                    <span className="form-hint">Creates a button that increases parent task progress when clicked</span>

                    {isIncrementSubtask && (
                      <div className="form-group" style={{ marginTop: '12px' }}>
                        <label className="form-label">Increment Amount</label>
                        <input
                          type="number"
                          className="form-input"
                          value={incrementAmount}
                          onChange={(e) => setIncrementAmount(parseInt(e.target.value) || 1)}
                          min="1"
                          max={parentTaskForSubtask.progressTracking.target}
                        />
                        <span className="form-hint">
                          Increases progress by {incrementAmount} {parentTaskForSubtask.progressTracking.unit} per click
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button className="submit-btn" onClick={addSubtask}>
                  Create Subtask
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {showEditCategory && editingCategory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditCategory(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Edit Category</h2>
                <button className="close-btn" onClick={() => setShowEditCategory(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Category name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && updateCategory()}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Icon</label>
                  <div className="icon-grid">
                    {categoryIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${editingCategory.icon === icon ? 'active' : ''}`}
                        onClick={() => setEditingCategory({ ...editingCategory, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category Color</label>
                  <div className="color-grid">
                    {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${editingCategory.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingCategory({ ...editingCategory, color })}
                      />
                    ))}
                  </div>
                </div>

                <button className="submit-btn" onClick={updateCategory}>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddCategory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddCategory(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Add New Category</h2>
                <button className="close-btn" onClick={() => setShowAddCategory(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Icon</label>
                  <div className="icon-grid">
                    {categoryIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${newCategoryIcon === icon ? 'active' : ''}`}
                        onClick={() => setNewCategoryIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category Color</label>
                  <div className="color-grid">
                    {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <button className="submit-btn" onClick={addCategory}>
                  Create Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Selection Modal for Routines */}
      <AnimatePresence>
        {showTaskSelectionModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTaskSelectionModal(false)}
          >
            <motion.div
              className="modal task-selection-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Select Tasks for Routine</h2>
                <button className="close-btn" onClick={() => setShowTaskSelectionModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="task-selection-list">
                  {activeTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                      No active tasks available. Create some tasks first!
                    </div>
                  ) : (
                    activeTasks.map((task) => (
                      <div
                        key={task._id}
                        className={`task-selection-item ${selectedTasksForRoutine.includes(task.text) ? 'selected' : ''}`}
                        onClick={() => handleTaskToggleForRoutine(task.text)}
                      >
                        <div className="task-selection-checkbox">
                          {selectedTasksForRoutine.includes(task.text) && <Check size={16} />}
                        </div>
                        <span className="task-icon">{task.icon}</span>
                        <span className="task-text">{task.text}</span>
                        <span className="task-category" style={{ background: `${task.categoryColor}20`, color: task.categoryColor }}>
                          {task.category}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="submit-btn"
                    onClick={handleConfirmTaskSelection}
                    disabled={selectedTasksForRoutine.length === 0}
                    style={{
                      opacity: selectedTasksForRoutine.length === 0 ? 0.5 : 1,
                      cursor: selectedTasksForRoutine.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Confirm Selection ({selectedTasksForRoutine.length})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Note Modal */}
      <AnimatePresence>
        {showQuickNoteModal && quickNoteCategory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickNoteModal(false)}
          >
            <motion.div
              className="modal quick-note-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  <span style={{ marginRight: '8px' }}>{quickNoteCategory.icon}</span>
                  Quick Note - {quickNoteCategory.name}
                </h2>
                <button className="close-btn" onClick={() => setShowQuickNoteModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <textarea
                  className="quick-note-input"
                  placeholder="Type your note here..."
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      saveQuickNote();
                    }
                  }}
                  autoFocus
                  rows={4}
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                  Press Ctrl+Enter to save
                </div>

                <button
                  className="submit-btn"
                  onClick={saveQuickNote}
                  disabled={!quickNoteText.trim()}
                  style={{
                    marginTop: '1rem',
                    opacity: !quickNoteText.trim() ? 0.5 : 1,
                    cursor: !quickNoteText.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-notification"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <span className="toast-icon">🎉</span>
            <span className="toast-message">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
