import { motion } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import './RewardAnimation.css';

const RewardAnimation = ({ data }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 0.5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <motion.div
      className="reward-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="reward-content">
        {data.levelUp ? (
          <>
            <motion.div
              className="level-up-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
            >
              <Trophy size={80} className="reward-icon trophy" />
              <motion.h2
                className="level-up-text"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                LEVEL UP!
              </motion.h2>
              <motion.div
                className="new-level"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                Level {data.newLevel}
              </motion.div>
            </motion.div>

            {/* Particle explosion */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="particle"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: particle.x * 10,
                  y: particle.y * 10,
                  opacity: 0,
                  scale: 0
                }}
                transition={{
                  delay: particle.delay,
                  duration: particle.duration
                }}
              >
                <Star size={20} fill="#ffd700" color="#ffd700" />
              </motion.div>
            ))}
          </>
        ) : (
          <>
            <motion.div
              className="xp-gain-container"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
            >
              <Zap size={60} className="reward-icon xp" fill="#ffd700" />
              <motion.div
                className="xp-amount"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{data.xp} XP
              </motion.div>
              <motion.div
                className="task-completed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Quest Completed!
              </motion.div>
            </motion.div>

            {/* Stars animation */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="star-particle"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                initial={{ opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos((i * 360) / 12 * Math.PI / 180) * 200,
                  y: Math.sin((i * 360) / 12 * Math.PI / 180) * 200,
                  opacity: 0,
                  scale: 1.5
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
              >
                <Star size={16} fill="#ffd700" color="#ffd700" />
              </motion.div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default RewardAnimation;
