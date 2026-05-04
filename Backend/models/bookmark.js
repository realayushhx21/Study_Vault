const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'resource', required: true },
    collection: { type: String, default: 'General', trim: true },
    createdAt: { type: Date, default: Date.now }
});

// Ensure a user can only bookmark a resource once per collection
bookmarkSchema.index({ user: 1, resource: 1, collection: 1 }, { unique: true });

module.exports = mongoose.model('bookmark', bookmarkSchema);
