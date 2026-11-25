const User = require('../models/User');
const Team = require('../models/Team');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate unique code
const generateTeamId = () => 'FLOW-' + Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createTeam = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const teamId = generateTeamId();

  const team = await Team.create({
    name,
    teamId,
    owner: req.user.id,
    members: [req.user.id]
  });

  await User.findByIdAndUpdate(req.user.id, { $push: { teamIds: teamId } });
  res.status(201).json(team);
});

exports.joinTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.body;
  const team = await Team.findOne({ teamId });
  if (!team) return res.status(404).json({ error: 'Invalid Team ID' });

  // Add to team & user
  if (!team.members.includes(req.user.id)) {
    team.members.push(req.user.id);
    await team.save();
  }
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { teamIds: teamId } });

  res.json({ ok: true, team });
});

exports.getMembers = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findOne({ teamId }).populate('members', 'name email online lastSeen');
  if (!team) return res.status(404).json({ error: 'Team not found' });
  
  res.json(team.members.map(u => ({
    id: u._id,
    name: u.name,
    email: u.email,
    online: u.online,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email)}`
  })));
});