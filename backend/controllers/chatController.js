const User = require('../models/User'); // 👈 Yeh line add karo
const Message = require('../models/Message');
const { asyncHandler } = require('../middleware/errorHandler');

/* ================= GET MESSAGES ================= */
exports.getMessages = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);

  // 👇 YEH NAYA SECURITY CHECK HAI 👇
  const user = await User.findById(req.user.id);
  if (!user.teamIds.includes(teamId)) {
    return res.status(403).json({ error: 'Access denied: You are not a member of this team' });
  }
  // 👆 SECURITY CHECK END 👆

  const messages = await Message.find({ teamId })
    .sort({ createdAt: 1 })
    .limit(limit);

  res.json(messages);
});

/* ================= SEND MESSAGE (REST fallback) ================= */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { teamId, text } = req.body;
  if (!teamId || !text) {
    return res.status(400).json({ error: 'teamId and text are required' });
  }

  const msg = await Message.create({
    teamId,
    sender: req.user.id,
    senderName: req.user.name,
    text
  });

  const io = req.app.get('io');
  if (io) io.to(teamId).emit('chat:message', msg);

  res.status(201).json(msg);
});