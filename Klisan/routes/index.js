const express = require('express');
const router = express.Router();
const episod = require("../models/episod.js");
const Auth = require("../models/auth.js");
const common = require('./common');

router.get('/', function (req, res, next) {	 //@todo pretty page
	episod.getnewEpisods()
		.then(episods => {
			if("search" in req.query) {
				episods = common.search(req.query.search, episods);
				if(episods.length == 0) { // not found						
					res.render('searchNF');
					return; 
				}
			}			
			res.render('episods', {episod: episods, userRights: req.user});			
		})
		.catch (() => res.render('error'));
});

router.get('/about', function (req, res) {	
	res.render('about', { userRights: req.user});				
});

module.exports = router;
