# Quest Master Documentation

Welcome to the Quest Master documentation! This folder contains comprehensive guides for all features.

## 📚 Available Documentation

### Feature Guides

- **[Quick Start Guide](./QUICK_START.md)** ⚡ **START HERE!** - Get started in 60 seconds
  - Step-by-step first goal creation
  - Visual examples
  - Common goal templates
  - Pro tips

- **[Goal-Based Tasks](./GOAL_BASED_TASKS.md)** - Complete guide to creating and managing goal-based recurring tasks with calendar timeline visualization
  - How to create goal-based tasks
  - Calendar timeline features
  - Progress tracking
  - Use cases and examples

### Changelogs

- **[Goal-Based Tasks Implementation](./CHANGELOG_GOAL_BASED_TASKS.md)** - Detailed changelog for the goal-based tasks feature
  - Technical implementation details
  - Files modified
  - Code changes
  - Testing checklist

## 🚀 Quick Start Guides

### Creating Your First Goal-Based Task

1. Click the "➕ Add Task" button
2. Select "Goal-Based" as task type
3. Fill in:
   - Task name (e.g., "Read The Great Gatsby")
   - Final goal (e.g., 250 pages)
   - Unit (e.g., pages)
   - Daily/weekly/monthly goal (e.g., 10 pages per day)
   - XP reward (e.g., 25 XP)
4. Review the goal summary showing estimated completion date
5. Click "Add Task"
6. View your task timeline in the calendar!

### Example: 30-Day Reading Challenge

```
Task: Read "The Hobbit"
Final Goal: 300 pages
Daily Target: 10 pages
Timeline: 30 days
XP per day: 25 XP

Calendar shows:
- 30 days marked with purple indicators
- Each day shows countdown (29d, 28d, etc.)
- Final day highlighted in green with 🎯 flag
- Tooltip: "Goal: 10 pages, X days remaining"
```

## 📖 Feature Overview

### Goal-Based Tasks

Track long-term goals with automatic calendar timeline visualization:

**Key Features**:
- 🎯 **Estimated Completion**: See exactly when you'll finish
- 📅 **Timeline Visualization**: Calendar shows all days until completion
- ⏱️ **Days Remaining**: Counter on each calendar day
- ✅ **Quick Complete**: One-click daily goal completion
- 🏆 **XP Rewards**: Earn experience points for each goal completed
- 📊 **Progress Tracking**: Real-time progress bars and percentages

**Perfect For**:
- Reading books (track pages)
- Savings goals (track money)
- Fitness challenges (track distance)
- Learning projects (track hours)
- Any measurable goal

## 🗂️ Documentation Structure

```
docs/
├── README.md                           # This file
├── GOAL_BASED_TASKS.md                # Feature guide
└── CHANGELOG_GOAL_BASED_TASKS.md      # Implementation details
```

## 💡 Tips & Tricks

### Calendar View

- **Purple indicators**: Show each day's goal
- **Green highlight**: Completion day with 🎯 flag
- **Hover tooltips**: See detailed progress info
- **Click any day**: View all tasks for that date

### Task Management

- **Quick Complete**: Use the "✅ +X unit" button for fast updates
- **Progress Badge**: Shows current progress and completion date
- **Days Remaining**: Know exactly how much time you have
- **XP System**: Stay motivated with gamification

### Best Practices

1. **Start Small**: Set achievable daily targets
2. **Be Consistent**: Mark progress every day
3. **Review Timeline**: Check calendar regularly
4. **Adjust as Needed**: Edit goals if pace changes
5. **Celebrate Milestones**: Enjoy XP rewards along the way

## 🔧 Technical Documentation

### For Developers

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **State**: Local state with API synchronization
- **Styling**: Custom CSS with Framer Motion animations

### Key Components

- `Calendar.jsx` - Timeline visualization
- `App.jsx` - Task creation and management
- Backend API - Task storage and XP calculation

### Data Structure

```javascript
{
  taskType: "progress",
  progressTracking: {
    enabled: true,
    current: 0,
    target: 250,
    unit: "pages",
    unitInterval: 10,
    intervalType: "daily",
    xpPerUnit: 25
  }
}
```

## 📝 Contributing

When adding new features:

1. Update relevant documentation in `docs/`
2. Create changelog with implementation details
3. Include code examples
4. Add use cases and best practices
5. Update this README with links

## 🐛 Troubleshooting

### Goal Not Showing in Calendar

Check:
- Task type is "progress"
- progressTracking.enabled is true
- Task is not completed
- current < target

### Completion Date Wrong

Verify:
- intervalType matches intention
- unitInterval is correct
- target and current are accurate

### No XP When Updating

Ensure:
- xpPerUnit is set
- unitInterval is configured
- Full intervals completed (not partial)

## 📮 Support

For questions or issues:

1. Check the relevant documentation file
2. Review troubleshooting sections
3. Check code comments in modified files
4. Create an issue with details

## 🎯 Roadmap

Potential future enhancements:

- [ ] Pause/resume goals
- [ ] Progress history graphs
- [ ] Streak tracking
- [ ] Shared goals
- [ ] Goal templates
- [ ] Weekly/monthly reports
- [ ] Integration with external trackers

## 📄 License

Part of the Quest Master project.

---

**Last Updated**: 2025-10-20
**Documentation Version**: 1.0
