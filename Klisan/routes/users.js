const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const Serial = require("../models/serial.js");
const common = require('./common');

const bodyParser = require('body-parser');
const busboy  = require('busboy-body-parser');

const Auth = require("../models/auth.js");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use(busboy({limit: '5mb'}));


router.get('/users', (req, res) => {
	res.render('users', {userRights: req.user, adminRights: Auth.checkAdminRights(req.user)})
});

router.get('/promote', (req, res) => {
	User.promote(req.query.id)			
		.then(() => {
			res.redirect(`/users/${req.query.id}`);
		})
	   	.catch(() => res.status(404).render('error'));
	}
);

router.get('/users/:id', (req, res) => {
	User.getById(req.params.id)
		.then(user => {
			return Promise.all(
				[user, Serial.getArr(user.watchList)]);
		})
		.then(([user, episods]) => {
			const me = user.id == req.user._id;
			res.render('user', {user: user, episod: episods, userRights: req.user, adminRights: Auth.checkAdminRights(req.user), me: me});
		})
	   	.catch(() => res.status(404).render('error'));
	}
);




module.exports = router;