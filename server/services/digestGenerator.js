import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const DIGESTS_FILE = path.join(DATA_DIR, 'digests.json');

const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    return [];
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

export async function generateDigestForUser(userId) {
  try {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === userId);

    if (!user || !user.aiApiKeys) {
      console.log(`No AI config for user ${userId}`);
      return null;
    }

    const { claudeApiKey, chatgptApiKey, selectedProvider } = user.aiApiKeys;

    if (!selectedProvider || (!claudeApiKey && !chatgptApiKey)) {
      console.log(`No API key configured for user ${userId}`);
      return null;
    }

    const tasks = readData(TASKS_FILE);
    const userTasks = tasks.filter(t => t.userId === userId);

    // Gather task statistics
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.completed).length;
    const pendingTasks = userTasks.filter(t => !t.completed).length;
    const highPriorityTasks = userTasks.filter(t => !t.completed && t.priority === 'high').length;

    // Get overdue tasks
    const now = new Date();
    const overdueTasks = userTasks.filter(t =>
      !t.completed &&
      t.deadline &&
      new Date(t.deadline) < now
    );

    // Get upcoming tasks (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = userTasks.filter(t =>
      !t.completed &&
      t.deadline &&
      new Date(t.deadline) >= now &&
      new Date(t.deadline) <= nextWeek
    );

    let contextText = `Daily Task Summary for ${user.username}:
- Total Tasks: ${totalTasks}
- Completed: ${completedTasks}
- Pending: ${pendingTasks}
- High Priority: ${highPriorityTasks}
- Overdue: ${overdueTasks.length}
- Upcoming (Next 7 days): ${upcomingTasks.length}

High Priority Tasks:
${userTasks.filter(t => !t.completed && t.priority === 'high').slice(0, 5).map(t => `- ${t.text}`).join('\n') || 'None'}

Overdue Tasks:
${overdueTasks.slice(0, 5).map(t => `- ${t.text} (Due: ${new Date(t.deadline).toLocaleDateString()})`).join('\n') || 'None'}

Upcoming Tasks:
${upcomingTasks.slice(0, 5).map(t => `- ${t.text} (Due: ${new Date(t.deadline).toLocaleDateString()})`).join('\n') || 'None'}`;

    // Use custom prompt if user has configured one, otherwise use default
    const defaultPrompt = `Create a concise daily digest. Use ONLY bullet points, no paragraphs.

Format (max 100 words):

## 🎯 Focus Today
- [Top 3 tasks to complete today, be specific]

## ⚠️ Attention Needed
- [Overdue/high priority items, if any]

## ✅ Progress
- [Completion rate/streak/achievement]

## 💪 Quick Win
- [One easy task to build momentum]

Rules:
- Maximum 1 line per bullet
- No explanatory text
- Direct task names from the list
- Skip sections if empty`;

    const customPrompt = user.digestPreferences?.customPrompt;
    const userPrompt = customPrompt && customPrompt.trim() ? customPrompt : defaultPrompt;

    const digestPrompt = `${contextText}

${userPrompt}`;

    let digest = '';

    if (selectedProvider === 'claude' && claudeApiKey) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: digestPrompt
          }]
        },
        {
          headers: {
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      digest = response.data.content[0].text;
    } else if (selectedProvider === 'chatgpt' && chatgptApiKey) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a motivational productivity coach creating encouraging, actionable daily digests for task management. Use a friendly, conversational tone and provide specific, practical advice.'
            },
            {
              role: 'user',
              content: digestPrompt
            }
          ],
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${chatgptApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      digest = response.data.choices[0].message.content;
    }

    // Save digest
    const digests = readData(DIGESTS_FILE);
    const digestEntry = {
      userId,
      digest,
      stats: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        highPriority: highPriorityTasks,
        overdue: overdueTasks.length,
        upcoming: upcomingTasks.length
      },
      generatedAt: new Date().toISOString()
    };

    // Remove old digests for this user (keep only last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filteredDigests = digests.filter(d =>
      d.userId !== userId || new Date(d.generatedAt) > sevenDaysAgo
    );
    filteredDigests.push(digestEntry);

    writeData(DIGESTS_FILE, filteredDigests);

    console.log(`✓ Generated digest for user ${user.username}`);
    return digestEntry;

  } catch (error) {
    console.error(`Error generating digest for user ${userId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

export async function generateAllDigests() {
  const users = readData(USERS_FILE);
  const results = [];

  for (const user of users) {
    if (user.digestPreferences?.enabled && user.aiApiKeys?.selectedProvider) {
      const result = await generateDigestForUser(user.id);
      if (result) {
        results.push(result);
      }
    }
  }

  console.log(`✓ Generated ${results.length} digests`);
  return results;
}
