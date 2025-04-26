const express = require('express');
const router = express.Router();
const { getProfile, editProfile, changePassword } = require('../Controller/profileController');

router.get('/profile', getProfile);
router.post('/profile/edit', editProfile);
router.post('/profile/change-password', changePassword);

module.exports = router;