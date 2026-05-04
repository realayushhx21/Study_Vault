const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, default: '' }
});

const quizSchema = new mongoose.Schema({
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'resource', required: true },
    questions: [questionSchema],
    generatedAt: { type: Date, default: Date.now }
});

quizSchema.index({ resource: 1 });

module.exports = mongoose.model('quiz', quizSchema);
