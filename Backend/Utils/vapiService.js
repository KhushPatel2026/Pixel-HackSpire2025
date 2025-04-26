const axios = require('axios');

const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID; // Add to .env

const initiateVoiceChat = async (userId, question) => {
    try {
        const response = await axios.post(
            `${VAPI_API_URL}/call`,
            {
                assistantId: VAPI_ASSISTANT_ID,
                context: {
                    userId,
                    question
                },
                // Optional: Specify phone number or use WebRTC
                type: 'web', // For browser-based calls
                // Add phoneNumberId if using phone calls
            },
            {
                headers: {
                    Authorization: `Bearer ${VAPI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(`Vapi AI error: ${error.response?.data?.message || error.message}`);
    }
};

module.exports = { initiateVoiceChat };