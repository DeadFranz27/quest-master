# Goal-Based Tasks Feature

## Overview

Goal-Based Tasks are a powerful feature that allows you to set long-term goals with daily, weekly, monthly, or yearly targets. The system automatically calculates completion dates and displays your progress timeline in the calendar.

## Use Cases

Perfect for:
- 📚 **Reading books**: Set a goal to read 250 pages with a daily target of 10 pages
- 💰 **Savings goals**: Save $5000 with a monthly target of $500
- 🏃 **Fitness goals**: Run 100km with a weekly target of 10km
- 📝 **Writing projects**: Write 50000 words with a daily target of 1000 words
- 🎯 **Any incremental goal**: Track progress toward any measurable objective

## How to Create a Goal-Based Task

1. Click the "➕ Add Task" button
2. Select **"Goal-Based"** as the task type
3. Fill in the following fields:

### Required Fields

- **Task Name**: A descriptive name for your goal (e.g., "Read Harry Potter")
- **Final Goal** (Target Value): The total amount you want to achieve (e.g., 250 pages)
- **Unit**: The measurement unit (pages, €, $, £, km, hours, items, %)
- **Goal Amount**: How much you want to complete per period (e.g., 10 pages)
- **Per Period**: The time interval (Daily, Weekly, Monthly, Yearly)
- **XP Reward**: Experience points awarded each time you complete a period goal

### Example: Reading a Book

```
Task Name: Read "The Great Gatsby"
Target Value: 250 pages
Unit: pages
Goal Amount: 10
Per Period: Daily
XP Reward: 25 XP

Result: Complete 10 pages per day to finish in 25 days
```

## Goal Summary

When creating a goal-based task, you'll see a summary showing:
- ✅ **Final Goal**: Total target (e.g., 250 pages)
- 📅 **Daily/Weekly/Monthly Target**: Amount per period (e.g., 10 pages per day)
- ⏱️ **Estimated Time**: How long it will take (e.g., 25 days)
- 🎯 **Completion Date**: Expected finish date

## Calendar View

### Timeline Visualization

The calendar displays your goal-based tasks with:
- **Purple indicators** on each day showing the daily goal
- **Days remaining** counter on each calendar cell
- **Green completion flag (🎯)** on the estimated completion date
- **Tooltip** showing cumulative target and remaining days

### What You See

- All days from today until completion are marked with your task
- Each day shows how many days remain until completion
- The final day is highlighted in green with a 🎯 flag
- Hover over any day to see detailed progress information

## Completing Daily Goals

### From the Task List

1. Find your goal-based task in the task list
2. You'll see:
   - Current progress (e.g., "50/250 pages (🎯 Nov 15)")
   - A green button: "✅ +10 pages" (or your goal amount)
   - Days/weeks/months remaining counter
3. Click the "✅ +10 pages" button to mark today's goal as complete
4. You'll earn XP rewards for each goal completion

### Progress Tracking

- **Visual Progress Bar**: Shows completion percentage
- **Automatic XP Awards**: Earn XP for each interval completed
- **Level Up System**: Progress contributes to your overall level
- **Completion Celebration**: Special animation when you reach 100%

## How It Works

### Calculation Logic

1. **System calculates**:
   - Remaining amount = Target - Current progress
   - Periods needed = Remaining ÷ Goal per period
   - Completion date = Today + Periods needed

2. **Calendar shows**:
   - One indicator per day (for daily goals)
   - One indicator per week start (for weekly goals)
   - One indicator per month start (for monthly goals)
   - One indicator per year start (for yearly goals)

3. **As you progress**:
   - Current progress increases
   - Days remaining decreases
   - Completion date may adjust based on your pace

## Tips for Success

### 1. Set Realistic Goals
- Start with achievable daily targets
- You can always increase later if it's too easy
- Better to complete consistently than set impossible targets

### 2. Daily Check-Ins
- Mark your progress every day
- Use the quick "+X unit" button for fast updates
- Check the calendar to see your timeline

### 3. Track Multiple Goals
- You can have several goal-based tasks running simultaneously
- Each appears on the calendar with its own timeline
- Color-coded by category for easy identification

### 4. Adjust as Needed
- Edit the task if your goal changes
- Update the daily target if you need to go faster/slower
- The calendar automatically recalculates

## Example Scenarios

### Example 1: Reading Challenge
```
Goal: Read 3 books (750 pages total)
Daily Target: 25 pages
Timeline: 30 days
Calendar View: Purple indicators on 30 days with countdown
Completion: Nov 20, 2025
```

### Example 2: Savings Goal
```
Goal: Save €2000 for vacation
Monthly Target: €200
Timeline: 10 months
Calendar View: Purple indicator on 1st of each month
Completion: August 2026
```

### Example 3: Fitness Challenge
```
Goal: Run 100km
Weekly Target: 10km
Timeline: 10 weeks
Calendar View: Purple indicator every Monday
Completion: 10 weeks from today
```

## Backend Structure

### Task Model

```javascript
{
  text: "Read The Great Gatsby",
  taskType: "progress",
  progressTracking: {
    enabled: true,
    current: 0,           // Current progress
    target: 250,          // Final goal
    unit: "pages",        // Measurement unit
    unitInterval: 10,     // Goal per period
    intervalType: "daily", // Period type
    xpPerUnit: 25         // XP reward
  }
}
```

### API Endpoints

All standard task endpoints support goal-based tasks:
- `POST /api/tasks` - Create new goal-based task
- `PATCH /api/tasks/:id` - Update progress
- `GET /api/tasks` - Retrieve all tasks (includes progress tracking data)

### Progress Update

```javascript
// Update progress
PATCH /api/tasks/:taskId
{
  "progressTracking.current": newValue
}
```

## Frontend Components

### Key Components Modified

1. **Calendar.jsx** (`/src/components/Calendar.jsx`)
   - Enhanced `getProgressGoalsForDate()` to calculate timeline
   - Added completion date visualization
   - Shows days remaining on each cell

2. **App.jsx** (`/src/App.jsx`)
   - Updated task creation modal with goal summary
   - Enhanced progress display with completion dates
   - Modified quick-complete button to use interval amount

### State Management

- Progress tracked in `task.progressTracking` object
- Calendar recalculates timeline on each render
- XP awards trigger on interval completion

## Troubleshooting

### Calendar Not Showing Goal

**Problem**: Goal-based task not appearing in calendar

**Solutions**:
- Verify `taskType` is set to "progress"
- Check `progressTracking.enabled` is true
- Ensure task is not marked as completed
- Confirm current < target

### Wrong Completion Date

**Problem**: Estimated completion date seems incorrect

**Solutions**:
- Check `intervalType` matches your intention (daily vs weekly)
- Verify `unitInterval` is correct
- Ensure `target` and `current` values are accurate
- Calendar uses ceiling division for partial periods

### XP Not Awarding

**Problem**: Not receiving XP when updating progress

**Solutions**:
- Verify `xpPerUnit` is set
- Check `unitInterval` is configured
- XP only awards when completing full intervals
- Example: If unitInterval=10, going from 5→12 awards XP, but 5→9 doesn't

## Best Practices

### 1. Choose the Right Interval Type

- **Daily**: For habits you do every day (reading, exercise)
- **Weekly**: For goals with flexible daily schedules
- **Monthly**: For financial goals or monthly commitments
- **Yearly**: For very long-term projects

### 2. Unit Selection

Choose units that make sense for your goal:
- **Pages**: Books, documents
- **Currency** (€/$/ £): Financial goals
- **Distance** (km): Running, cycling
- **Time** (hours): Learning, practice
- **Items**: Tasks, articles, videos
- **Percentage**: General progress

### 3. XP Balance

Reward yourself appropriately:
- **Low effort goals**: 10-25 XP per interval
- **Medium effort goals**: 25-50 XP per interval
- **High effort goals**: 50-100 XP per interval
- **Challenging goals**: 100+ XP per interval

## Future Enhancements

Potential features for future versions:
- [ ] Pause/Resume functionality for goals
- [ ] Historical progress graphs
- [ ] Streak tracking for consecutive completions
- [ ] Shared goals with other users
- [ ] Goal templates for common objectives
- [ ] Integration with external trackers
- [ ] Smart recommendations for goal amounts
- [ ] Weekly/monthly progress reports

## Related Features

- **Recurring Tasks**: For tasks that repeat but don't accumulate
- **Subtasks**: For breaking down complex tasks
- **Categories**: Organize goals by life area
- **XP System**: Gamification for motivation
- **Calendar View**: Visual timeline planning

## Support

For issues or feature requests:
1. Check this documentation first
2. Review the code in the modified files
3. Create an issue in the project repository
4. Include: goal setup, expected behavior, actual behavior

---

**Last Updated**: 2025-10-20
**Version**: 1.0
**Feature Status**: ✅ Fully Implemented
