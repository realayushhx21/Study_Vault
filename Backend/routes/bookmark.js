const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { toggleBookmark, getMyBookmarks, getMyCollections, checkBookmark, removeBookmark } = require('../controllers/bookmark');

router.use(authorize);
router.post('/toggle', toggleBookmark);
router.get('/', getMyBookmarks);
router.get('/collections', getMyCollections);
router.get('/check/:resourceId', checkBookmark);
router.delete('/:bookmarkId', removeBookmark);

module.exports = router;
