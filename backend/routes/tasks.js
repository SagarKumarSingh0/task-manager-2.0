const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats
} = require('../controllers/taskController');

router.use(auth); // all task routes protected

router.get('/', getTasks);
router.get('/stats', getStats);
router.get('/:id', getTask);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;