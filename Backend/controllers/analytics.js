const Resource = require('../models/resource');
const User = require('../models/user');
const Bookmark = require('../models/bookmark');
const ViewHistory = require('../models/viewHistory');
const mongoose = require('mongoose');

// Badge definitions
const BADGE_DEFS = [
    { name: 'First Upload', icon: '🎯', check: (s) => s.totalUploads >= 1 },
    { name: 'Contributor', icon: '📝', check: (s) => s.totalUploads >= 5 },
    { name: 'Scholar', icon: '🎓', check: (s) => s.totalUploads >= 10 },
    { name: 'Reviewer', icon: '⭐', check: (s) => s.totalReviews >= 5 },
    { name: 'Popular', icon: '🔥', check: (s) => s.totalDownloads >= 50 },
    { name: 'Top Rated', icon: '👑', check: (s) => s.bestRating >= 4.5 },
    { name: 'Bookworm', icon: '📚', check: (s) => s.totalBookmarks >= 10 },
    { name: 'Helper', icon: '🤝', check: (s) => s.totalUploads >= 3 && s.totalReviews >= 3 },
];

// Compute stats for a user
const computeUserStats = async (userId) => {
    const resources = await Resource.find({ uploadedBy: userId });
    const totalUploads = resources.length;
    const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const totalViews = resources.reduce((sum, r) => sum + (r.viewCount || 0), 0);
    const totalReviewsReceived = resources.reduce((sum, r) => sum + r.reviews.length, 0);
    const avgRating = totalReviewsReceived > 0
        ? resources.reduce((sum, r) => sum + (r.averageRating || 0) * r.reviews.length, 0) / totalReviewsReceived
        : 0;
    const bestRating = resources.reduce((best, r) => Math.max(best, r.averageRating || 0), 0);

    // Count reviews this user has written (across all resources)
    const allResources = await Resource.find({ 'reviews.user': mongoose.Types.ObjectId.createFromHexString(userId) });
    const totalReviews = allResources.reduce((count, r) => {
        return count + r.reviews.filter(rev => rev.user.toString() === userId).length;
    }, 0);

    const totalBookmarks = await Bookmark.countDocuments({ user: userId });

    const reputation = (totalUploads * 10) + (totalDownloads * 2) + (totalViews * 0.5) + (avgRating * 20);

    return {
        totalUploads,
        totalDownloads,
        totalViews,
        totalReviewsReceived,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        bestRating,
        totalBookmarks,
        reputation: Math.round(reputation)
    };
};

// Compute badges for a user
const computeBadges = (stats) => {
    return BADGE_DEFS
        .filter(b => b.check(stats))
        .map(b => ({ name: b.name, icon: b.icon, earnedAt: new Date() }));
};

// Dashboard stats for logged-in user
const getDashboard = async (req, res) => {
    const userId = req.user.id;
    const stats = await computeUserStats(userId);
    const badges = computeBadges(stats);

    // Update user badges and reputation
    await User.findByIdAndUpdate(userId, {
        badges,
        reputation: stats.reputation
    });

    // Recent views on user's resources
    const userResourceIds = (await Resource.find({ uploadedBy: userId }).select('_id')).map(r => r._id);
    const recentViews = await ViewHistory.find({ resource: { $in: userResourceIds } })
        .sort({ viewedAt: -1 })
        .limit(10)
        .populate('resource', 'title');

    res.json({ stats, badges, recentViews });
};

// Global leaderboard
const getLeaderboard = async (req, res) => {
    const users = await User.find({ isVerified: true })
        .select('email name reputation badges joinedAt')
        .sort({ reputation: -1 })
        .limit(20);

    // Enrich with upload counts
    const leaderboard = await Promise.all(users.map(async (user) => {
        const uploadCount = await Resource.countDocuments({ uploadedBy: user._id });
        const resources = await Resource.find({ uploadedBy: user._id });
        const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
        return {
            _id: user._id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            reputation: user.reputation || 0,
            badges: user.badges || [],
            uploadCount,
            totalDownloads,
            joinedAt: user.joinedAt
        };
    }));

    res.json({ leaderboard });
};

// Trending resources
const getTrending = async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const resources = await Resource.find({})
        .sort({ downloadCount: -1, viewCount: -1, averageRating: -1 })
        .limit(10)
        .select('title subject semester averageRating viewCount downloadCount uploadedByEmail createdAt difficulty keyTopics');

    // Compute trending scores with time decay
    const trending = resources.map(r => {
        const age = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = age < 7 ? 2 : age < 30 ? 1.5 : 1;
        const score = ((r.downloadCount || 0) * 3 + (r.viewCount || 0) + (r.averageRating || 0) * r.reviews?.length * 5) * recencyBoost;
        return { ...r.toObject(), trendingScore: Math.round(score) };
    }).sort((a, b) => b.trendingScore - a.trendingScore);

    res.json({ trending });
};

// Smart recommendations for logged-in user
const getRecommendations = async (req, res) => {
    const userId = req.user.id;

    // Get user's view history
    const viewedHistory = await ViewHistory.find({ user: userId })
        .sort({ viewedAt: -1 })
        .limit(20)
        .populate('resource', 'subject semester');

    const viewedResourceIds = viewedHistory.map(v => v.resource?._id).filter(Boolean);
    const subjects = [...new Set(viewedHistory.map(v => v.resource?.subject).filter(Boolean))];
    const semesters = [...new Set(viewedHistory.map(v => v.resource?.semester).filter(Boolean))];

    let recommendations;

    if (subjects.length > 0 || semesters.length > 0) {
        // Content-based filtering
        recommendations = await Resource.find({
            _id: { $nin: viewedResourceIds },
            $or: [
                { subject: { $in: subjects } },
                { semester: { $in: semesters } }
            ]
        })
            .sort({ averageRating: -1, viewCount: -1 })
            .limit(8)
            .select('title subject semester averageRating viewCount downloadCount uploadedByEmail difficulty keyTopics createdAt');
    } else {
        // Fallback: show top-rated resources
        recommendations = await Resource.find({ uploadedBy: { $ne: userId } })
            .sort({ averageRating: -1, viewCount: -1 })
            .limit(8)
            .select('title subject semester averageRating viewCount downloadCount uploadedByEmail difficulty keyTopics createdAt');
    }

    res.json({ recommendations });
};

module.exports = { getDashboard, getLeaderboard, getTrending, getRecommendations };
