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
		User.getAll()		
			.then(users => {
				res.render('users', {users: users, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)})
			})
	   		.catch(() => res.status(404).render('error', {code: 404, error: "Not found"}));
	}
);

router.get('/promote', (req, res) => {
	User.promote(req.query.id)			
		.then(() => {
			res.redirect(`/users/${req.body.id}`);
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
		.then(([user, serieses]) => {
			res.render('user', {user: user, series: serieses, userRights: req.user});
		})
	   	.catch(() => res.status(404).render('error'));
	}
);




router.post('/addToWatchList', (req, res) => { //@todo 
	const userId = req.body.userId;
	const sId = req.body.sId;
	User.addToWL(userId, sId)
		.then(() => res.redirect(`/users/${userId}`))
		.catch(() => res.status(404).render('error'));
});

router.get('/checkWatchList', (req, res) => {
	const userId = req.query.userId;	
	User.getWL(userId)
		.then(user => {
			return Serial.getArr(user.watchList);
		})
		.then(serials => {				
				res.render('serials', {serials: serials, addSerial: "fillWatchList"});
		})
		.catch(() => res.status(404).render('error'));
});




module.exports = router;