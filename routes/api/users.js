const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// Import User model
const User = require('../../models/User');

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
	'/',
	// Midleware for validation
	[
		check('name', 'Name is requiered').not().isEmpty(),
		check('email', 'Please include a valid e-mail').isEmail(),
		check(
			'password',
			'Please enter password with 6 or more characters'
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

        const {name, email, password} = req.body;

        try{
            // See if the user exists
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            // Get users gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });

            user = new User({
                name,
                email,
                avatar,
                password
            });

            // Encrypt the password using bcrypt
            // Something like a seed
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            // Save user to DB
            await user.save();

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
