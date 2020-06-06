const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectID,
		ref: 'users'
	},
	text: {
		type: String,
		required: true
	},
	name: {
		type: String,
	},
	avatar: {
		type: String
	},
	like: [{
		user: {
			type: mongoose.Schema.Types.ObjectID,
			ref: 'users'
		}
	}],
	comment: [{
		user: {
			type: mongoose.Schema.Types.ObjectID,
			ref: 'users'
		},
		text: {
			type: String,
			required: true
		},
		name: {
			type: String,
		},
		avatar: {
			type: String
		},
		date: {
			type: Date,
			default: Date.now()
		}
	}],
	date: {
		type: Date,
		default: Date.now()
	}
});

module.exports = Post = mongoose.model('post', PostSchema);