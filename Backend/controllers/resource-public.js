const Resource = require('../models/resource');
const ViewHistory = require('../models/viewHistory');
const jwt = require('jsonwebtoken');

const getAllResources = async (req, res) => {
    const { page = 1, search = '', subject = '', semester = '' } = req.query;
    const limit = 8;
    const skip = (page - 1) * limit;

    const filter = {
        ...(subject && { subject }),
        ...(semester && { semester: Number(semester) }),
        ...(search && {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ]
        })
    };

    const total = await Resource.countDocuments(filter);
    const resources = await Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({ resources, totalPages: Math.ceil(total / limit), currentPage: +page });
};

const getSingleResource = async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Increment view count
    resource.viewCount = (resource.viewCount || 0) + 1;
    await resource.save();

    // Track view in history (if user is authenticated)
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await ViewHistory.create({ user: decoded.id, resource: resource._id });
        }
    } catch (err) {
        // Silently fail - view tracking is non-critical
    }

    res.json(resource);
};

// Get similar resources (content-based)
const getSimilarResources = async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const similar = await Resource.find({
        _id: { $ne: resource._id },
        $or: [
            { subject: resource.subject },
            { semester: resource.semester }
        ]
    })
        .sort({ averageRating: -1, viewCount: -1 })
        .limit(4)
        .select('title subject semester averageRating viewCount downloadCount uploadedByEmail difficulty createdAt');

    res.json({ similar });
};

module.exports = { getAllResources, getSingleResource, getSimilarResources };