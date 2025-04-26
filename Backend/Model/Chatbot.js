const mongoose = require('mongoose');

const chatbot = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    chatHistory: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        date: { type: Date, default: Date.now },
    }],
});

const model = mongoose.model('Chatbot', chatbot);
module.exports = model;
