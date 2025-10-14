import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import './CategoryManager.css';

const CategoryManager = ({ categories, token, onClose, onUpdate }) => {
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6366f1', icon: '📁' });

  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
  ];

  const icons = ['📁', '💼', '🏠', '❤️', '📚', '🎯', '🏋️', '🍎', '💰', '🎨', '🎮', '📱', '✈️', '🎭'];

  const addCategory = async () => {
    if (!newCategory.name) return;

    try {
      const response = await fetch('http://localhost:3001/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        setNewCategory({ name: '', color: '#6366f1', icon: '📁' });
        if (onUpdate) {
          await onUpdate();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (onUpdate) {
          await onUpdate();
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <motion.div
      className="category-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="category-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="category-form">
            <h3>Add New Category</h3>
            <input
              type="text"
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />

            <div className="icon-grid">
              {icons.map(icon => (
                <button
                  key={icon}
                  className={`icon-option ${newCategory.icon === icon ? 'active' : ''}`}
                  onClick={() => setNewCategory({ ...newCategory, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="color-grid">
              {colors.map(color => (
                <button
                  key={color}
                  className={`color-option ${newCategory.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setNewCategory({ ...newCategory, color })}
                />
              ))}
            </div>

            <button className="add-category-btn" onClick={addCategory}>
              <Plus size={20} />
              Add Category
            </button>
          </div>

          <div className="existing-categories">
            <h3>Existing Categories</h3>
            <div className="categories-list">
              {categories.map(cat => (
                <div key={cat._id} className="category-item" style={{ borderLeft: `4px solid ${cat.color}` }}>
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                  <button
                    className="delete-btn"
                    onClick={() => deleteCategory(cat._id)}
                    title="Delete category"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CategoryManager;
