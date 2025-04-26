const express = require('express');
const passport = require('passport');
const { handleGoogleCallback, handleGithubCallback } = require('../Controller/socialAuthController');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/register' }), handleGoogleCallback);
router.get('/github', passport.authenticate('github', { scope: ['profile', 'email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/register' }), handleGithubCallback);

module.exports = router;