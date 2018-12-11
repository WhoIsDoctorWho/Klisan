const express = require('express');
const bodyParser = require('body-parser');
const busboy  = require('busboy-body-parser');

const episod = require("../models/episod.js");
const Serial = require("../models/serial.js");
const common = require('./common');
const Auth = require("../models/auth.js");
	

const router = express.Router();


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use(busboy({limit: '5mb'}));

router.get('/episods', (req, res) => { 
	res.render('episods', {userRights: req.user});			
  
});

router.get('/addEpisod', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		res.render('newEpisod', {sId: req.query.sId, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)});	
});

router.post('/addEpisod', (req, res) => {
	if(!Auth.checkAdminRights(req.user)) {
		res.status(403).render('error', {code: 403, error: "Forbidden"});
		return;
	}        
	const fileObject = req.files.ava;
	const fileBuffer = fileObject.data;
    common.cloudinary.v2.uploader.upload_stream({ resource_type: 'image' },
        (error, result) => {             

			if(error) {
				res.status(404).render('error');
				return;
			}						
			
			const newEpisod = {
				title: req.body.title,
				seasonNumber: req.body.seasonNumber,
				episodNumber: req.body.episodNumber,
				mark: req.body.mark,
				description: req.body.description, 
				avaUrl: result.secure_url,	
				videoLink: common.parseVideoLink(req.body.videoLink),
				serialId: req.body.sId
			};
			episod.create(newEpisod)
				.then(newEpisod => {
					return Promise.all([Serial.addEpisod(newEpisod), newEpisod]);  // save id of added episod to serial
				})
				.then(result => res.redirect(`/episod/${result[1].id}`))							
				.catch(err => {
					console.log(err.toString());
					res.status(404).render('error');
				});            
        })
        .end(fileBuffer);
});

router.get('/deleteEpisod', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		episod.delete(req.query.id)
			.then(episod => Serial.removeEpisod(episod.serialId.toString(), episod.id))		
			.then(()  => res.redirect('/serials'))
			.catch(() => res.status(500).render('error'), {code: 500, error: "Unable to delete"});
});

router.get('/updateEpisod', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		episod.getById(req.query.id)
			.then(episod => 
				res.render('updateEpisod', {episod: episod, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)}))				
			.catch(() => 
				res.status(404).render('error'), {code: 404, error: "Not found"}); 
});

router.post('/updateEpisod', function (req, res) { 
	if(!Auth.checkAdminRights(req.user)) {
		res.status(403).render('error', {code: 403, error: "Forbidden"})
		return;
	}						
	const updepisod = {
		title: req.body.title,
		seasonNumber: req.body.seasonNumber,
		episodNumber: req.body.episodNumber,
		mark: req.body.mark,
		description: req.body.description, 		
		videoLink: common.parseVideoLink(req.body.videoLink),
	};
	episod.update(updepisod, req.body.sId)
		.then((x) => 
			res.redirect(`/episod/${x[1]._id}`)) 
		.catch(() => {			
			res.status(500).render('error', {code: 500, error: "Unable to update"});		
		});           
});

router.get('/episod/:id', function (req, res) {
	episod.getById(req.params.id)
		.then(episod => {			
			res.render('episod', {episod: episod, userRights: req.user, adminRights: Auth.checkAdminRights(req.user), eId: episod._id}); // eId - id of episod
		})
		.catch(() => res.status(404).render('error'), {code: 404, error: "Not found"});
});


module.exports = router;