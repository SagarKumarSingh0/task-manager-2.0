const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'system'], default: 'text' }
  },
  { timestamps: true }
);

MessageSchema.index({ teamId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);