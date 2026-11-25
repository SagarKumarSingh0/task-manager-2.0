const router = require('express').Router();
const auth = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/chatController');

router.use(auth);

router.get('/:teamId', getMessages);
router.post('/', sendMessage);

module.exports = router;