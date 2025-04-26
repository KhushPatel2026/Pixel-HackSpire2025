const mongoose = require('mongoose');

const Feedback = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    feedbackDescription: { type: String, required: true },
    date: { type: Date, default: Date.now },
    strength: { type: String, required: true },
    weakness: { type: String, required: true },
})

const model = mongoose.model('Feedback', Feedback);
module.exports = model;