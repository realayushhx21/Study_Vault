const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { createGroup, getMyGroups, joinGroup, getGroup, addResourceToGroup, removeResourceFromGroup, leaveGroup } = require('../controllers/studyGroup');

router.use(authorize);
router.post('/', createGroup);
router.get('/', getMyGroups);
router.post('/join', joinGroup);
router.get('/:id', getGroup);
router.post('/:id/add-resource', addResourceToGroup);
router.post('/:id/remove-resource', removeResourceFromGroup);
router.post('/:id/leave', leaveGroup);

module.exports = router;
