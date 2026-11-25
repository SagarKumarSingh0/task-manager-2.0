const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    /* ========== JOIN TEAM ROOM ========== */
    socket.on('join:team', async ({ teamId, userId }) => {
      socket.join(teamId);
      if (userId) {
        await User.findByIdAndUpdate(userId, { online: true }).catch(() => {});
        io.to(teamId).emit('user:online', { userId });
      }
      console.log(`👥 ${socket.id} joined ${teamId}`);
    });

    /* ========== CHAT MESSAGE ========== */
    socket.on('chat:message', async (data) => {
      try {
        const { teamId, senderId, senderName, text } = data;
        if (!teamId || !text?.trim()) return;

        const msg = await Message.create({
          teamId,
          sender: senderId,
          senderName,
          text: text.trim()
        });

        io.to(teamId).emit('chat:message', {
          _id: msg._id,
          senderName: msg.senderName,
          text: msg.text,
          createdAt: msg.createdAt
        });
      } catch (e) {
        console.error('Chat error:', e.message);
      }
    });

    /* ========== TYPING ========== */
    socket.on('typing', ({ teamId, user }) => {
      socket.to(teamId).emit('typing', { user });
    });

    /* ========== DISCONNECT ========== */
    socket.on('disconnect', async () => {
      console.log('❌ Disconnected:', socket.id);
    });
  });
};