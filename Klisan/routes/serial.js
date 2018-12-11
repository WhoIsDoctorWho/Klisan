const express = require('express');
const bodyParser = require('body-parser');
const busboy  = require('busboy-body-parser');

const Serial = require("../models/serial.js");
const episod = require("../models/episod.js");
const User = require("../models/user.js");
const Auth = require("../models/auth.js");

const common = require('./common');
	

const router = express.Router();


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use(busboy({limit: '5mb'}));

router.get('/serials', (req, res) => {
	res.render('serials', {userRights: req.user, adminRights: Auth.checkAdminRights(req.user)});		
});


router.get('/addSerial', (req, res) => {
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"});
	else
		res.render('newSerial', {userRights: req.user, adminRights: Auth.checkAdminRights(req.user)});
})

router.post('/addSerial', (req, res) => {
	if(!Auth.checkAdminRights(req.user)) {
		res.status(403).render('error', {code: 403, error: "Forbidden"});
		return;
	}
	const fileObject = req.files.ava;
	const fileBuffer = fileObject.data;
    common.cloudinary.v2.uploader.upload_stream({ resource_type: 'image' },
        (error, result) => {              
			if(error) {
				res.status(403).render('error', {code: 403, error: "Forbidden"});
				return;
			}
			const newSerial = {
				title: req.body.title,
				seasonsNum: req.body.seasonsNum,
				mark: req.body.mark,
				description: req.body.description, 
				avaUrl: result.secure_url,	
			};
			Serial.create(newSerial)
				.then((x) => 
					res.redirect(`/serial/${x._id}`)) 
				.catch(() => {res.status(500).render('error', {code: 500, error: "Unable to create"}); });            
        })
        .end(fileBuffer);
});

router.get('/deleteSerial', function (req, res) { 
	if(!Auth.checkAdminRights(req.user)) 
		res.status(403).render('error', {code: 403, error: "Forbidden"});
	else {
		episod.deleteFromSerial(req.query.sId)
			.then(() => Serial.delete(req.query.sId)		
			.then(()  => res.redirect('serials'))
			.catch(() => res.status(500).render('error', {code: 500, error: "Unable to delete"})));
	}
});

router.get('/updateSerial', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"});
	else
		Serial.getById(req.query.sId)
			.then(serial => 
				res.render('updateSerial', {serial: serial, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)}))
			.catch(() => res.status(500).render('error', {code: 500, error: "Unable to update"}));
});

router.post('/updateSerial', function (req, res) { 
	if(!Auth.checkAdminRights(req.user)) {
		res.status(403).render('error', {code: 403, error: "Forbidden"});
		return;
	}
	const updSerial = {
		title: req.body.title,
		seasonsNum: req.body.seasonsNum,
		mark: req.body.mark,
		description: req.body.description, 		
	};
			
	Serial.update(updSerial, req.body.sId)
		.then((x) => 
			res.redirect(`/serial/${x[1]._id}`)) 
		.catch(() => {			
			res.status(404).render('error', {code: 404, error: "Not found"});		
		});
});

router.get('/serial/:id', function (req, res) {
	Serial.getById(req.params.id)
		.then(serial => {	
			let episods = serial.episods;						
			if("search" in req.query) {
				episods = common.search(req.query.search, episods);
				if(episods.length == 0) { // not found						
					res.render('searchNF');
					return; 
				}
			}							
			res.render('episods', {episod: episods, userRights: req.user, adminRights: Auth.checkAdminRights(req.user),
				sId: serial.id, watch: true});

		}) 
		.catch(() => res.status(404).render('error', {code: 404, error: "Not found"}));
});
 
router.get('/addToWL', function (req, res) {

	User.addToWL(req.user._id, req.query.sId)
		.then(() => res.redirect("serial/"+req.query.sId))
		.catch(() => res.status(500).render('error', {code: 500, error: "Try again later"}));

	
});


module.exports = router;