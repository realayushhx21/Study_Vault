const mongoose = require('mongoose');
const crypto = require('crypto');

const studyGroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    createdByEmail: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'resource' }],
    inviteCode: { 
        type: String, 
        unique: true, 
        default: () => crypto.randomBytes(4).toString('hex').toUpperCase() 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('studyGroup', studyGroupSchema);
