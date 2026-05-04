const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'resource', required: true },
    viewedAt: { type: Date, default: Date.now }
});

viewHistorySchema.index({ user: 1, resource: 1 });
viewHistorySchema.index({ viewedAt: -1 });

module.exports = mongoose.model('viewHistory', viewHistorySchema);
