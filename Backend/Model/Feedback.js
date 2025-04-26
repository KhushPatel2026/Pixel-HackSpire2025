const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    feedbackDescription: { type: String, required: true },
    date: { type: Date, default: Date.now },
    strength: { type: String, required: true },
    weakness: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 }
});

module.exports = mongoose.model('Feedback', feedbackSchema);