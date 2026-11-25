const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

/* ================= AI CHAT ================= */
exports.chat = asyncHandler(async (req, res) => {
  const { message = '' } = req.body;
  const msg = message.toLowerCase();

  /* --- Try OpenAI if key exists --- */
  if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a concise task management assistant. Help users prioritize work, plan sprints, and stay productive. Use markdown-like formatting.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: 400
      });
      return res.json({
        reply: completion.choices[0].message.content,
        source: 'openai'
      });
    } catch (e) {
      console.warn('OpenAI failed, falling back to built-in:', e.message);
    }
  }

  /* --- FREE rule-based fallback --- */
  const replies = {
    prioritize:
      '🎯 **Priority Framework:**\n1. **Urgent + Important** → Do now (high)\n2. **Important, not urgent** → Schedule (medium)\n3. **Urgent, not important** → Delegate (low)\n4. **Neither** → Delete\n\nStart your day with #1 tasks only!',
    sprint:
      '⚡ **Sprint Planning:**\n• Max 5 tasks per sprint\n• Estimate each in hours\n• Reserve 20% buffer\n• Daily review, weekly adjust\n• Celebrate completed sprints 🎉',
    productivity:
      '🚀 **Productivity Boosters:**\n1. **Pomodoro**: 25 min focus + 5 min break\n2. **Time-blocking**: Assign time slots\n3. **2-minute rule**: Do small tasks instantly\n4. **Batch similar work**\n5. **Deep work** in mornings',
    focus:
      '🧠 **Focus Technique:**\n• Silence notifications for 25 min\n• **Eat the Frog** — hardest first\n• Single-task, never multitask\n• Track distraction triggers\n• Real breaks (no scrolling!)',
    organize:
      '📋 **Organizing Tasks:**\n• Group by project using **tags**\n• Use **due dates** for time-sensitivity\n• Set **priority** (low/medium/high)\n• Review board every Monday\n• Archive done tasks weekly',
    team:
      '👥 **Team Collaboration:**\n• Use **Team Chat** for quick syncs\n• Assign clearly — one owner per task\n• Daily standup (15 min max)\n• Update task status honestly\n• Give credit publicly, feedback privately',
    hello:
      'Hi! 👋 I can help with:\n• **"prioritize"** — priority framework\n• **"sprint"** — sprint planning\n• **"productivity"** — tips\n• **"focus"** — focus techniques\n• **"organize"** — task organization\n• **"team"** — collaboration'
  };

  for (const [key, reply] of Object.entries(replies)) {
    if (msg.includes(key)) return res.json({ reply, source: 'builtin' });
  }

  const count = await Task.countDocuments();
  res.json({
    reply: `🤖 Try asking about:\n• **"prioritize"**\n• **"plan a sprint"**\n• **"productivity tips"**\n• **"focus techniques"**\n• **"team collaboration"**\n\n📊 You have **${count} tasks** in the system.`,
    source: 'builtin'
  });
});