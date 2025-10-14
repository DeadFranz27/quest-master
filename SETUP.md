# Quest Master - Complete Setup Guide

## ✨ What's New

Quest Master now includes:
- 🔐 **Secure Authentication** with JWT tokens
- 🎨 **Dark Theme** with modern black/grey interface
- 📝 **Task Icons** - Customize tasks with emojis
- 🏷️ **Categories** - Organize tasks by color-coded groups
- ⏰ **Deadlines** - Set timers from days to years
- 💾 **Database Storage** - MongoDB backend
- 🎮 **Home Assistant Integration** - Block devices until tasks complete

## Prerequisites

- Node.js 18+ (you have v18.19.1)
- MongoDB (needs to be installed)

## Quick Start

### 1. Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Or use MongoDB in Docker:**
```bash
docker run -d -p 27017:27017 --name quest-master-mongo mongo:latest
```

### 2. Start the Backend Server

The server is already running! If you need to restart it:

```bash
cd server
npm start
```

You should see:
```
✓ Quest Master Server running on http://localhost:3001
✓ Connected to MongoDB
```

### 3. Start the Frontend (Already Running)

The frontend is running at: **http://localhost:5173/**

If you need to restart:
```bash
npm run dev
```

## First Time Setup

1. **Open the app**: http://localhost:5173/

2. **Register a new account**:
   - Enter username, email, and password (min 6 characters)
   - Your password is hashed with bcrypt before storage
   - You'll receive a JWT token that lasts 30 days

3. **Create your first task**:
   - Select an icon
   - Enter task description
   - Choose priority (Low/Medium/High/Critical)
   - Select a category (Work, Personal, Health, Learning)
   - Optionally set a deadline
   - Click "Add Quest"

4. **Complete a task**:
   - Click the green checkmark
   - Watch the XP animation!
   - Level up when you earn enough XP

## Features Guide

### Task Icons
- Click any icon in the icon selector before creating a task
- Icons help visually identify tasks at a glance
- 12 pre-selected icons available

### Categories
- Default categories: Work 💼, Personal 🏠, Health ❤️, Learning 📚
- Each category has a unique color
- Click "Manage Categories" to add custom categories
- Choose custom icons and colors for your categories

### Deadlines
- Use the date/time picker to set a deadline
- Deadlines can be:
  - Hours/days in the future
  - Weeks/months away
  - Even years in the future!
- Tasks show time remaining and turn red when overdue

### Device Blocking (Home Assistant)
- Select a device to block for any task
- While the task is incomplete, the device will be turned off
- Complete the task to unlock the device
- See [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md) for integration

### Gamification System
- **XP Rewards**:
  - Low priority: 25 XP
  - Medium priority: 50 XP
  - High priority: 100 XP
  - Critical priority: 200 XP
- **Leveling**: XP requirement increases by 1.5x each level
- **Animations**: Particle effects and celebrations on completion

## Security Features

✅ **Password Hashing**: Passwords hashed with bcrypt (10 rounds)
✅ **JWT Tokens**: Secure authentication with 30-day expiration
✅ **Protected Routes**: All user data requires authentication
✅ **Input Validation**: Server-side validation on all inputs
✅ **CORS**: Configured for localhost development

**Production Tips**:
- Change `JWT_SECRET` in `.env` to a long random string
- Use HTTPS in production
- Set up MongoDB with authentication
- Use environment variables for all secrets

## Environment Variables

Edit `server/.env`:

```env
# Server
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/quest-master

# Security
JWT_SECRET=change-this-to-something-very-random-and-long

# Home Assistant (optional)
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your_token_here
```

## Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongodb
# or
docker ps | grep mongo

# Check the connection
mongo quest-master --eval "db.stats()"
```

### "Invalid token" error
- Your token may have expired (30 days)
- Log out and log back in to get a new token

### Frontend not connecting to backend
- Make sure server is running on port 3001
- Check browser console for CORS errors
- Verify `API_URL` in `src/App.jsx` is `http://localhost:3001`

### Tasks not saving
- Check MongoDB connection
- Look at server logs for errors
- Verify you're logged in (check for token in localStorage)

### Home Assistant not working
- Server will work fine without Home Assistant
- Device blocking features gracefully fail without HA
- See [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md) for setup

## Development

### Database Management

**View all users:**
```javascript
use quest-master
db.users.find({}, {password: 0})
```

**View all tasks:**
```javascript
db.tasks.find().pretty()
```

**View all categories:**
```javascript
db.categories.find().pretty()
```

**Reset everything:**
```javascript
db.dropDatabase()
```

### API Testing

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get tasks (with token):**
```bash
curl http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
quest-master/
├── src/
│   ├── components/
│   │   ├── Auth.jsx              # Login/Register
│   │   ├── TaskList.jsx          # Task display with categories
│   │   ├── LevelProgress.jsx     # XP bar
│   │   ├── RewardAnimation.jsx   # Celebration effects
│   │   └── CategoryManager.jsx   # Category CRUD
│   ├── App.jsx                   # Main app with auth state
│   └── App.css                   # Dark theme styles
├── server/
│   ├── server.js                 # Express + MongoDB backend
│   ├── package.json
│   └── .env                      # Configuration
├── SETUP.md                      # This file
└── HOME_ASSISTANT_SETUP.md       # HA integration guide
```

## What's Next?

Future enhancements you could add:
- [ ] Task recurring/repeating
- [ ] Streak tracking
- [ ] Achievement badges
- [ ] Team/multiplayer mode
- [ ] Mobile app (React Native)
- [ ] Desktop notifications
- [ ] Task templates
- [ ] Statistics dashboard
- [ ] Export/import tasks
- [ ] Dark/light theme toggle

## Support

- Check server logs: `cd server && npm start`
- Check browser console: F12 → Console tab
- MongoDB logs: `/var/log/mongodb/mongod.log`
- Test health: http://localhost:3001/health

---

**Made with ❤️ for productive people who love games**
