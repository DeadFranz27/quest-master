import cron from 'node-cron';
import { generateAllDigests } from '../services/digestGenerator.js';

// Run digest generation every hour and check if any user needs a digest
cron.schedule('0 * * * *', async () => {
  console.log('Checking for digest generation...');
  await generateAllDigests();
});

console.log('✓ Digest scheduler initialized');
