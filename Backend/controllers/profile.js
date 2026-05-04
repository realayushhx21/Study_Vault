const User = require('../models/user');
const Resource = require('../models/resource');
const Bookmark = require('../models/bookmark');

// Get my profile
const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiresAt');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const uploadCount = await Resource.countDocuments({ uploadedBy: req.user.id });
    const resources = await Resource.find({ uploadedBy: req.user.id });
    const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const totalViews = resources.reduce((sum, r) => sum + (r.viewCount || 0), 0);
    const bookmarkCount = await Bookmark.countDocuments({ user: req.user.id });

    res.json({
        user,
        stats: {
            uploadCount,
            totalDownloads,
            totalViews,
            bookmarkCount
        }
    });
};

// Update my profile
const updateProfile = async (req, res) => {
    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    res.json({ msg: 'Profile updated', user: { name: user.name, bio: user.bio, email: user.email } });
};

// Get public profile of any user
const getPublicProfile = async (req, res) => {
    const user = await User.findById(req.params.userId).select('email name bio badges reputation joinedAt');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const uploadCount = await Resource.countDocuments({ uploadedBy: req.params.userId });
    const resources = await Resource.find({ uploadedBy: req.params.userId })
        .select('title subject semester averageRating viewCount downloadCount createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

    res.json({ user, uploadCount, recentResources: resources });
};

module.exports = { getProfile, updateProfile, getPublicProfile };
