// Backend/routes/chat.js

const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { chatWithPDF } = require('../controllers/chat');

// Protected route — user must be logged in to chat
router.use(authorize);
router.post('/:resourceId', chatWithPDF);

module.exports = router;