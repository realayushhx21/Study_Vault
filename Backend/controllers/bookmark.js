const Bookmark = require('../models/bookmark');
const Resource = require('../models/resource');

// Toggle bookmark (add or remove)
const toggleBookmark = async (req, res) => {
    const { resourceId, collection } = req.body;
    const userId = req.user.id;

    if (!resourceId) return res.status(400).json({ msg: 'Resource ID is required' });

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ msg: 'Resource not found' });

    const collectionName = collection || 'General';

    const existing = await Bookmark.findOne({ user: userId, resource: resourceId, collection: collectionName });

    if (existing) {
        await existing.deleteOne();
        return res.json({ msg: 'Bookmark removed', bookmarked: false });
    }

    await Bookmark.create({ user: userId, resource: resourceId, collection: collectionName });
    res.status(201).json({ msg: 'Bookmark added', bookmarked: true });
};

// Get all my bookmarks
const getMyBookmarks = async (req, res) => {
    const { collection } = req.query;
    const filter = { user: req.user.id };
    if (collection) filter.collection = collection;

    const bookmarks = await Bookmark.find(filter)
        .populate('resource')
        .sort({ createdAt: -1 });

    res.json({ bookmarks });
};

// Get my collections list
const getMyCollections = async (req, res) => {
    const collections = await Bookmark.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) } },
        { $group: { _id: '$collection', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    res.json({ collections: collections.map(c => ({ name: c._id, count: c.count })) });
};

// Check if a resource is bookmarked by the current user
const checkBookmark = async (req, res) => {
    const { resourceId } = req.params;
    const existing = await Bookmark.findOne({ user: req.user.id, resource: resourceId });
    res.json({ bookmarked: !!existing });
};

// Remove a specific bookmark
const removeBookmark = async (req, res) => {
    const { bookmarkId } = req.params;
    const bookmark = await Bookmark.findById(bookmarkId);
    if (!bookmark) return res.status(404).json({ msg: 'Bookmark not found' });
    if (bookmark.user.toString() !== req.user.id) return res.status(403).json({ msg: 'Unauthorized' });
    await bookmark.deleteOne();
    res.json({ msg: 'Bookmark removed' });
};

module.exports = { toggleBookmark, getMyBookmarks, getMyCollections, checkBookmark, removeBookmark };
