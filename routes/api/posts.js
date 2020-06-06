const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post(
	"/",
	[
		auth,
		[
			check('text', 'Text is requiered')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id
			});

			const post = await newPost.save();

			return res.json(post);

		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}

	}
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const allPosts = await Post.find().sort("-date");
		return res.json(allPosts)
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Eroor");
	}
});

// @route   GET api/posts/:post_id
// @desc    Get a post by id
// @access  Private
router.get("/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if(!post) {
			return res.status(404).json({ msg: "Post not found" })
		}
		return res.json(post);
	} catch (err) {
		console.error(err.message);

		if (err.name === 'CastError') {
			return res.status(400).json({ msg: "Post not found" });
		}

		res.status(500).send("Server Eroor");
	}
});

// @route   DELETE api/posts/:post_id
// @desc    Delete a post
// @access  Private
router.delete("/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if(!post) {
			return res.status(404).json({ msg: "Post not found" })
		}

		// Check if user deleting is the owner
		if(post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" })
		}

		await post.remove();
		return res.json({ msg: "Post removed" });

		return res.json(post);
	} catch (err) {
		console.error(err.message);

		if (err.name === 'CastError') {
			return res.status(400).json({ msg: "Post not found" });
		}

		res.status(500).send("Server Eroor");
	}
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private
router.put("/like/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if(!post) {
			return res.status(404).json({ msg: "Post not found" })
		}

		// Check if the post has already been liked
		if(post.like.filter(like => like.user.toString() === req.user.id).length > 0) {
			return res.status(400).json({ msg: "Post already liked" })
		}

		post.like.unshift({ user: req.user.id });

		await post.save();

		return res.json(post.like);
	} catch (err) {
		console.error(err.message);

		if (err.name === 'CastError') {
			return res.status(400).json({ msg: "Post not found" });
		}

		res.status(500).send("Server Error");
	}
});

// @route   PUT api/posts/unlike/:post_id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if(!post) {
			return res.status(404).json({ msg: "Post not found" })
		}

		// Check if the post has already been liked
		if(post.like.filter(like => like.user.toString() === req.user.id).length === 0) {
			return res.status(400).json({ msg: "Post has not yet been liked" })
		}

		// Get removeIndex for the like
		const removeIndex = post.like.map(like => like.user.toString()).indexOf(req.user.id);

		post.like.splice(removeIndex, 1);

		await post.save();

		return res.json(post.like);
	} catch (err) {
		console.error(err.message);

		if (err.name === 'CastError') {
			return res.status(400).json({ msg: "Post not found" });
		}

		res.status(500).send("Server Error");
	}
});

// @route   POST api/posts/comment/:post_id
// @desc    Add a new comment on a post
// @access  Private
router.post(
	"/comment/:post_id",
	[
		auth,
		[
			check('text', 'Text is requiered')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const post = await Post.findById(req.params.post_id);

			if(!post) {
				return res.status(404).json({ msg: "Post not found" })
			}

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comment.unshift(newComment);

			await post.save();

			return res.json(post.comment);

		} catch (err) {
			console.error(err.message);

			if (err.name === 'CastError') {
				return res.status(400).json({ msg: "Post not found" });
			}

			res.status(500).send("Server Error");
		}

	}
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		if(!post) {
			return res.status(404).json({ msg: "Post not found" })
		}

		// Pull out comment from the post
		const comment = post.comment.find(comment => comment.id === req.params.comment_id);

		if(!comment) {
			return res.status(404).json({ msg: "Comment not found" });
		}

		// Check if user is the owner
		if(comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User not authorized" });
		}

		// Get removeIndex for the like
		const removeIndex = post.comment.map(comment => comment.user.toString()).indexOf(req.user.id);

		post.comment.splice(removeIndex, 1);

		await post.save();

		return res.json(post.comment);

	} catch (err) {
		console.error(err.message);
	}
});

module.exports = router;