import { motion } from 'framer-motion';
import './LevelProgress.css';

const LevelProgress = ({ player }) => {
  const percentage = (player.xp / player.xpToNextLevel) * 100;

  return (
    <div className="level-progress-container">
      <div className="level-info">
        <span className="level-text">Level {player.level}</span>
        <span className="xp-text">
          {player.xp} / {player.xpToNextLevel} XP
        </span>
      </div>
      <div className="progress-bar-container">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="progress-bar-glow" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default LevelProgress;
