const StudyGroup = require('../models/studyGroup');
const Resource = require('../models/resource');

// Create a study group
const createGroup = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ msg: 'Group name is required' });

    const group = await StudyGroup.create({
        name,
        description: description || '',
        createdBy: req.user.id,
        createdByEmail: req.user.email,
        members: [req.user.id]
    });

    res.status(201).json({ group });
};

// Get my groups (created or joined)
const getMyGroups = async (req, res) => {
    const groups = await StudyGroup.find({ members: req.user.id })
        .populate('createdBy', 'email name')
        .sort({ createdAt: -1 });

    res.json({ groups });
};

// Join a group by invite code
const joinGroup = async (req, res) => {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ msg: 'Invite code is required' });

    const group = await StudyGroup.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ msg: 'Group not found. Check the invite code.' });

    if (group.members.includes(req.user.id)) {
        return res.status(400).json({ msg: 'You are already a member of this group' });
    }

    group.members.push(req.user.id);
    await group.save();

    res.json({ msg: 'Joined group successfully', group });
};

// Get group details
const getGroup = async (req, res) => {
    const group = await StudyGroup.findById(req.params.id)
        .populate('createdBy', 'email name')
        .populate('members', 'email name')
        .populate('resources');

    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (!group.members.some(m => m._id.toString() === req.user.id)) {
        return res.status(403).json({ msg: 'You are not a member of this group' });
    }

    res.json({ group });
};

// Add resource to group
const addResourceToGroup = async (req, res) => {
    const { resourceId } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (!group.members.some(m => m.toString() === req.user.id)) {
        return res.status(403).json({ msg: 'You are not a member of this group' });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ msg: 'Resource not found' });

    if (group.resources.includes(resourceId)) {
        return res.status(400).json({ msg: 'Resource already in group' });
    }

    group.resources.push(resourceId);
    await group.save();

    res.json({ msg: 'Resource added to group' });
};

// Remove resource from group
const removeResourceFromGroup = async (req, res) => {
    const { resourceId } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });
    if (!group.members.some(m => m.toString() === req.user.id)) {
        return res.status(403).json({ msg: 'You are not a member of this group' });
    }

    group.resources = group.resources.filter(r => r.toString() !== resourceId);
    await group.save();

    res.json({ msg: 'Resource removed from group' });
};

// Leave group
const leaveGroup = async (req, res) => {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    group.members = group.members.filter(m => m.toString() !== req.user.id);

    if (group.members.length === 0) {
        await group.deleteOne();
        return res.json({ msg: 'Group deleted (you were the last member)' });
    }

    // Transfer ownership if creator leaves
    if (group.createdBy.toString() === req.user.id) {
        group.createdBy = group.members[0];
    }

    await group.save();
    res.json({ msg: 'Left group successfully' });
};

module.exports = { createGroup, getMyGroups, joinGroup, getGroup, addResourceToGroup, removeResourceFromGroup, leaveGroup };
