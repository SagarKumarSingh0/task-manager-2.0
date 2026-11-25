const router = require('express').Router();
const auth = require('../middleware/auth');
const { createTeam, joinTeam, getMembers } = require('../controllers/teamController');

router.use(auth);
router.post('/create', createTeam);
router.post('/join', joinTeam);
router.get('/:teamId/members', getMembers);

module.exports = router;