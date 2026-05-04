const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/profile');

router.get('/me', authorize, getProfile);
router.put('/me', authorize, updateProfile);
router.get('/:userId', getPublicProfile);

module.exports = router;
