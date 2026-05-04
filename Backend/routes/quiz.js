const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { generateQuiz, getQuiz } = require('../controllers/quiz');

router.use(authorize);
router.post('/generate/:resourceId', generateQuiz);
router.get('/:resourceId', getQuiz);

module.exports = router;
