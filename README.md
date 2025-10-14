# Quest Master 🏆

A gamified task management web application that rewards you with XP, levels, and achievements for completing tasks. Integrates with Home Assistant to block devices until tasks are completed.

## Features

✨ **Gamification System**
- Earn XP for completing tasks
- Level up with awesome animations
- Priority-based rewards (Low: 25 XP, Medium: 50 XP, High: 100 XP, Critical: 200 XP)
- Track total XP and completed quests

🎮 **Game-Like Experience**
- Beautiful gradient UI with glass-morphism effects
- Smooth animations powered by Framer Motion
- Particle effects and reward celebrations
- Progress bars with glowing effects
- Responsive design for mobile and desktop

🏠 **Home Assistant Integration**
- Block devices (PlayStation, Xbox, TV, etc.) until tasks are completed
- Automatic device control via Home Assistant API
- Real-time device status updates
- Visual indicators for blocked devices

💾 **Local Storage**
- Tasks and progress saved in browser
- No backend database required for basic use
- Resume from where you left off

## Tech Stack

- **Frontend**: React + Vite
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Express.js (for Home Assistant integration)
- **Styling**: CSS with modern features

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Web App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. (Optional) Set Up Home Assistant Integration

See [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md) for detailed instructions.

Quick setup:
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your Home Assistant details
npm start
```

## Usage

### Creating Tasks

1. Type your task in the input field
2. Select a priority level (determines XP reward)
3. (Optional) Select a device to block until completion
4. Click "Add Quest"

### Completing Tasks

1. Click the green checkmark on any active task
2. Enjoy the reward animation!
3. Watch your XP bar fill up
4. Level up when you reach the XP threshold

### Device Blocking

1. Select a device from the dropdown on any task
2. The device will be blocked (turned off) via Home Assistant
3. Complete the task to unblock the device
4. The device will automatically turn back on

## Customization

### Adjust XP Values

Edit `src/App.jsx` line 44:
```javascript
const xpValues = { low: 25, medium: 50, high: 100, critical: 200 };
```

### Add More Devices

Edit `src/components/TaskList.jsx` line 29-36 and `server/server.js` line 28-34:
```javascript
<option value="your_device">Your Device</option>
```

### Change Level Progression

Edit `src/App.jsx` line 68:
```javascript
newXpToNext = Math.floor(newXpToNext * 1.5); // Adjust multiplier
```

### Customize Colors

Edit `src/App.css` and component CSS files to change the color scheme.

## Project Structure

```
quest-master/
├── src/
│   ├── components/
│   │   ├── TaskList.jsx          # Task list and task cards
│   │   ├── TaskList.css
│   │   ├── LevelProgress.jsx     # XP progress bar
│   │   ├── LevelProgress.css
│   │   ├── RewardAnimation.jsx   # Reward effects
│   │   └── RewardAnimation.css
│   ├── App.jsx                   # Main app logic
│   ├── App.css                   # Main styles
│   └── main.jsx                  # Entry point
├── server/
│   ├── server.js                 # Express server for HA integration
│   ├── package.json
│   └── .env.example
├── public/
└── index.html
```

## Environment Variables

Create a `.env` file in the `server` directory:

```env
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your_long_lived_access_token
```

## API Endpoints

When the server is running:

- `POST /api/block-devices` - Block multiple devices
- `POST /api/unblock-device` - Unblock a single device
- `GET /api/blocked-devices` - Get currently blocked devices
- `GET /api/test-ha` - Test Home Assistant connection
- `GET /health` - Server health check

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Tips

- Start with easy tasks to build momentum
- Use Critical priority for important tasks that need immediate attention
- Block distracting devices during work/study time
- Complete tasks before bedtime to maintain your streak
- Use the app daily to build productive habits

## Troubleshooting

### Tasks not saving
- Check browser console for localStorage errors
- Try clearing browser cache
- Ensure cookies/storage is enabled

### Home Assistant not connecting
- Verify server is running (`npm start` in server directory)
- Check `.env` configuration
- Test connection: `curl http://localhost:3001/api/test-ha`
- See [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md)

### Animations laggy
- Close other browser tabs
- Reduce number of active tasks
- Update graphics drivers

## Future Enhancements

- [ ] Daily/weekly challenges
- [ ] Achievement badges
- [ ] Task categories
- [ ] Multiplayer mode (compete with friends)
- [ ] Mobile app (React Native)
- [ ] Calendar integration
- [ ] Task templates
- [ ] Statistics dashboard
- [ ] Dark/light theme toggle
- [ ] Custom reward sounds

## Contributing

Feel free to fork this project and customize it for your needs!

## License

MIT License - feel free to use this project however you like!

---

**Made with ❤️ for productive people who love games**
