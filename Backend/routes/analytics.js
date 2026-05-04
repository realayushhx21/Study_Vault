const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { getDashboard, getLeaderboard, getTrending, getRecommendations } = require('../controllers/analytics');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/trending', getTrending);

// Protected routes
router.get('/dashboard', authorize, getDashboard);
router.get('/recommendations', authorize, getRecommendations);

module.exports = router;
