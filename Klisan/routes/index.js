const express = require('express');
const router = express.Router();
const Series = require("../models/series.js");
const Auth = require("../models/auth.js");
const common = require('./common');

router.get('/', function (req, res, next) {	 //@todo pretty page
	Series.getNewSerieses()
		.then(serieses => {
			if("search" in req.query) {
				serieses = common.search(req.query.search, serieses);
				if(serieses.length == 0) { // not found						
					res.render('searchNF');
					return; 
				}
			}			
			res.render('serieses', {series: serieses, userRights: req.user});			
		})
		.catch (() => res.render('error'));
});

router.get('/about', function (req, res) {	
	res.render('about', { userRights: req.user});				
});

module.exports = router;
