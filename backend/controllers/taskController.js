const User = require('../models/User'); // 👈 Yeh line add karo
const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/errorHandler');

/* ================= LIST ================= */
exports.getTasks = asyncHandler(async (req, res) => {
  const { status, priority, search, teamId } = req.query;
  const filter = {};

  // 👇 YEH NAYA SECURITY CHECK HAI 👇
  if (!teamId) return res.status(400).json({ error: 'Team ID required' });
  const user = await User.findById(req.user.id);
  if (!user.teamIds.includes(teamId)) {
    return res.status(403).json({ error: 'Access denied: You are not a member of this team' });
  }
  filter.teamId = teamId; // 👈 Sirf is team ke tasks laao
  // 👆 SECURITY CHECK END 👆

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.json(tasks);
});

/* ================= GET ONE ================= */
exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name');
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

/* ================= CREATE ================= */
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, status, tags, dueDate, teamId, assignedTo } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const task = await Task.create({
    title,
    description,
    priority,
    status,
    tags: Array.isArray(tags) ? tags : [],
    dueDate: dueDate || null,
    teamId: teamId || 'team-alpha',
    assignedTo: assignedTo || null,
    createdBy: req.user.id
  });

  // Real-time broadcast
  const io = req.app.get('io');
  if (io) io.emit('task:created', task);

  res.status(201).json(task);
});

/* ================= UPDATE ================= */
exports.updateTask = asyncHandler(async (req, res) => {
  const allowed = ['title', 'description', 'status', 'priority', 'tags', 'dueDate', 'assignedTo'];
  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const io = req.app.get('io');
  if (io) io.emit('task:updated', task);

  res.json(task);
});

/* ================= DELETE ================= */
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const io = req.app.get('io');
  if (io) io.emit('task:deleted', req.params.id);

  res.json({ ok: true, id: req.params.id });
});

/* ================= STATS ================= */
exports.getStats = asyncHandler(async (req, res) => {
  const [total, todo, progress, done, overdue] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'todo' }),
    Task.countDocuments({ status: 'progress' }),
    Task.countDocuments({ status: 'done' }),
    Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
  ]);

  res.json({ total, todo, progress, done, overdue });
});