const Resource = require('../models/resource');
const uploadToCloudinary = require('../services/cloudinaryService');
const { generateSummary } = require('../services/aiService');

const uploadResource = async (req, res) => {
    const { title, subject, semester, description } = req.body;
    const url = req.file?.path;
    const result = await uploadToCloudinary(url);
    const pdfUrl = result.secure_url;
    if (!pdfUrl) return res.status(400).json({ message: 'PDF is required' });

    const newResource = new Resource({
        title,
        subject,
        semester: Number(semester),
        description,
        pdfUrl,
        uploadedBy: req.user.id,
        uploadedByEmail: req.user.email
    });

    const saved = await newResource.save();

    // AI Auto-Summarization (fire and don't block response)
    generateSummary(pdfUrl, title, subject).then(async (aiData) => {
        try {
            await Resource.findByIdAndUpdate(saved._id, {
                aiSummary: aiData.summary,
                keyTopics: aiData.keyTopics,
                difficulty: aiData.difficulty
            });
            console.log('AI summary generated for:', title);
        } catch (err) {
            console.error('Failed to save AI summary:', err.message);
        }
    });

    res.status(201).json(saved);
};

const getMyResources = async (req, res) => {
    console.log("Reached getMyResources controller");
    const myResources = await Resource.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(myResources);
};

const updateResource = async (req, res) => {
    const resource = await Resource.findById(req.params.id);

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (resource.uploadedBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, subject, semester, description } = req.body;
    let pdfUrl = resource.pdfUrl;

    if (req.file) {
        const url = req.file?.path;
        const result = await uploadToCloudinary(url);
        pdfUrl = result.secure_url;
    }

    resource.title = title || resource.title;
    resource.subject = subject || resource.subject;
    resource.semester = semester ? Number(semester) : resource.semester;
    resource.description = description || resource.description;
    resource.pdfUrl = pdfUrl || resource.pdfUrl;
    const updated = await resource.save();

    // Re-generate AI summary if PDF changed
    if (req.file) {
        generateSummary(pdfUrl, resource.title, resource.subject).then(async (aiData) => {
            try {
                await Resource.findByIdAndUpdate(resource._id, {
                    aiSummary: aiData.summary,
                    keyTopics: aiData.keyTopics,
                    difficulty: aiData.difficulty
                });
            } catch (err) {
                console.error('Failed to update AI summary:', err.message);
            }
        });
    }

    res.json(updated);
};

const addReview = async (req, res) => {
    const { rating, comment } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const newReview = {
        user: req.user.id,
        email: req.user.email,
        rating: Number(rating),
        comment
    };

    resource.reviews.push(newReview);

    // Recalculate average rating
    resource.averageRating =
        resource.reviews.reduce((sum, r) => sum + r.rating, 0) / resource.reviews.length;

    await resource.save();

    res.status(201).json({ message: 'Review added' });
};

const deleteResource = async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (resource.uploadedBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    await resource.deleteOne();
    res.json({ message: 'Resource deleted successfully' });
};

// Track download
const trackDownload = async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    resource.downloadCount = (resource.downloadCount || 0) + 1;
    await resource.save();
    res.json({ downloadCount: resource.downloadCount });
};

module.exports = { uploadResource, getMyResources, updateResource, addReview, deleteResource, trackDownload };