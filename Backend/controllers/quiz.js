const Quiz = require('../models/quiz');
const Resource = require('../models/resource');
const { generateQuizQuestions } = require('../services/aiService');

// Generate a quiz for a resource (or return cached quiz)
const generateQuiz = async (req, res) => {
    const { resourceId } = req.params;
    const { regenerate } = req.query;

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ msg: 'Resource not found' });

    // Check if quiz already exists
    if (!regenerate) {
        const existingQuiz = await Quiz.findOne({ resource: resourceId });
        if (existingQuiz) {
            return res.json({ quiz: existingQuiz });
        }
    }

    // Generate new quiz using AI
    const questions = await generateQuizQuestions(
        resource.pdfUrl,
        resource.title,
        resource.subject
    );

    if (questions.length === 0) {
        return res.status(500).json({ msg: 'Failed to generate quiz. Please try again.' });
    }

    // Delete old quiz if regenerating
    if (regenerate) {
        await Quiz.deleteOne({ resource: resourceId });
    }

    const quiz = await Quiz.create({
        resource: resourceId,
        questions
    });

    res.status(201).json({ quiz });
};

// Get quiz for a resource
const getQuiz = async (req, res) => {
    const { resourceId } = req.params;
    const quiz = await Quiz.findOne({ resource: resourceId });
    if (!quiz) return res.status(404).json({ msg: 'No quiz found for this resource. Generate one first.' });
    res.json({ quiz });
};

module.exports = { generateQuiz, getQuiz };
