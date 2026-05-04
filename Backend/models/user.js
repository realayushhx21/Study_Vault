const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email : {
        type:String,
        required : true,
        unique:true
    },
    password :{
        type : String,
        required : true,
    },
    name: { type: String, default: '' },
    bio: { type: String, default: '' },
    otp : String,
    otpExpiresAt : Date,
    isVerified : {
        type: Boolean,
        default : false
    },
    badges: [{
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now }
    }],
    reputation: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', userSchema);