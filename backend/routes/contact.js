const router = require('express').Router();
const { submitContact, listContacts } = require('../controllers/contactController');

router.post('/', submitContact);
router.get('/', listContacts); // open for demo — protect with admin auth in prod

module.exports = router;