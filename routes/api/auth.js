const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   GET api/auth
// @desc	Get users from JWT token
// @access  Public
router.get("/", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (e) {
		console.error(e.message);
		res.status(500).send('Server error');
	}
});

// @route   POST api/auth
// @desc    Authenticate users and get token
// @access  Public
router.post(
	'/',
	// Midleware for validation
	[
		check('email', 'Please include a valid e-mail').isEmail(),
		check(
			'password',
			'Password is required'
		).exists()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {email, password} = req.body;

		try{
			// See if the user exists
			let user = await User.findOne({ email });

			if (!user) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}

			// Authenticate password
			const isMatch = await bcrypt.compare(password, user.password);

			if(!isMatch) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}

			// Return JWT - JSON Web Token
			// Create payload which is basically the middle of JWT, the main info
			const payload = {
				user: {
					id: user.id
				}
			};
			// Signing the JWT with the secret in our default.json
			jwt.sign(
				payload,
				config.get('jwtSecret'),
				{expiresIn: 360000},
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				});

			// res.send('User registered');
		} catch(err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);


module.exports = router;