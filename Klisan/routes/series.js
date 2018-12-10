const express = require('express');
const bodyParser = require('body-parser');
const busboy  = require('busboy-body-parser');

const Series = require("../models/series.js");
const Serial = require("../models/serial.js");
const common = require('./common');
const Auth = require("../models/auth.js");
	

const router = express.Router();


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use(busboy({limit: '5mb'}));

router.get('/serieses', (req, res) => { 
	res.render('serieses', {userRights: req.user});			
  
});

router.get('/addSeries', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		res.render('newSeries', {sId: req.query.sId, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)});	
});

router.post('/addSeries', (req, res) => {
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
			
			const newSeries = {
				title: req.body.title,
				seasonNumber: req.body.seasonNumber,
				seriesNumber: req.body.seriesNumber,
				mark: req.body.mark,
				description: req.body.description, 
				avaUrl: result.url,	
				videoLink: common.parseVideoLink(req.body.videoLink),
				serialId: req.body.sId
			};
			Series.create(newSeries)
				.then(newSeries => {
					return Promise.all([Serial.addSeries(newSeries), newSeries]);  // save id of added series to serial
				})
				.then(result => res.redirect(`/series/${result[1].id}`))							
				.catch(err => {
					console.log(err.toString());
					res.status(404).render('error');
				});            
        })
        .end(fileBuffer);
});

router.get('/deleteSeries', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		Series.delete(req.query.id)
			.then(series => Serial.removeSeries(series.serialId.toString(), series.id))		
			.then(()  => res.redirect('/serials'))
			.catch(() => res.status(500).render('error'), {code: 500, error: "Unable to delete"});
});

router.get('/updateSeries', function (req, res) { 
	if(!Auth.checkAdminRights(req.user))
		res.status(403).render('error', {code: 403, error: "Forbidden"})
	else
		Series.getById(req.query.id)
			.then(series => 
				res.render('updateSeries', {series: series, userRights: req.user, adminRights: Auth.checkAdminRights(req.user)}))				
			.catch(() => 
				res.status(404).render('error'), {code: 404, error: "Not found"}); 
});

router.post('/updateSeries', function (req, res) { 
	if(!Auth.checkAdminRights(req.user)) {
		res.status(403).render('error', {code: 403, error: "Forbidden"})
		return;
	}						
	const updSeries = {
		title: req.body.title,
		seasonNumber: req.body.seasonNumber,
		seriesNumber: req.body.seriesNumber,
		mark: req.body.mark,
		description: req.body.description, 		
		videoLink: common.parseVideoLink(req.body.videoLink),
	};
	Series.update(updSeries, req.body.sId)
		.then((x) => 
			res.redirect(`/series/${x[1]._id}`)) 
		.catch(() => {			
			res.status(500).render('error', {code: 500, error: "Unable to update"});		
		});           
});

router.get('/series/:id', function (req, res) {
	Series.getById(req.params.id)
		.then(series => {			
			res.render('series', {series: series, userRights: req.user, eId: series._id}); // eId - id of episod
		})
		.catch(() => res.status(404).render('error'), {code: 404, error: "Not found"});
});


module.exports = router;