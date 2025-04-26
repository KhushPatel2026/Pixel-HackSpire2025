const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatHistory: [{
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        source: {
            type: String,
            enum: ['text', 'voice'],
            required: true
        },
        audioUrl: {
            type: String,
            required: false
        }
    }]
});

module.exports = mongoose.model('Chatbot', ChatbotSchema);