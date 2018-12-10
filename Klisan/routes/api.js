const express = require('express');

const passport = require('passport');
const crypto = require('crypto');
const router = express.Router();
const Users = require('../models/user');
const Serials = require('../models/serial');
const Serieses = require('../models/series');
const Auth = require('../models/auth');
const common = require('./common');

router.get('/me',
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        res.json(req.user);
    });

/* 
    API from USERS
*/

router.get('/users', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        Users.getAll()
            .then(users => {     
                const pageNumber = parseInt(req.query.page);
                users = common.pagination(users, pageNumber)                			
                if(!users || users.length === 0) 
                    return Promise.reject({status: 404, error: `No users`, page: pageNumber});
                res.json(users);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/users/:id",
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        Users.getById(req.params.id)
            .then(user => {
                if(!user) 
                    return Promise.reject({status: 404, error: `No user with id ${req.params.id}`});
                else 
                    res.json(user);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.put('/users/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Users.patch(req.body, req.params.id) // returns old object
            .then(user => {
                if(!user) 
                    return Promise.reject({status: 404, error: `No user with id ${req.params.id}`});  
                res.json(user);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));             
    }
);

router.patch('/users/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }
        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }
            Users.updAvatar(req.params.id, img.url)
                .then(user => res.json(user)) 
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })         
    }
);

router.delete('/users/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Users.delete(req.params.id)
            .then(user => {
                if (!user) 
                    return Promise.reject({status: 404, error: `No user with id ${req.params.id}`});
                else 
                    res.json(user);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

/* 
    API from SERIALS
*/

router.get('/serials', basicAuth,
    (req, res) => {        
        Serials.getAll()
            .then(serials => { 
                const searchStr = req.query.search;
                if(searchStr) {
                    serials = common.search(searchStr, serials);
                    if(serials.length === 0)  // not found						
                        return Promise.reject({status: 404, error: `No serials for "${searchStr}" request`, max: 1});                        
                }    
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(serials);
                serials = common.pagination(serials, pageNumber)                			
                if(!serials || serials.length === 0) 
                    return Promise.reject({status: 404, error: `No serials`, page: pageNumber});
                res.json({items: serials, max: maxPage});
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/serials/:id",
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        Serials.getByIdApi(req.params.id)
            .then(serial => {
                if(!serial) 
                    return Promise.reject({status: 404, error: `No serial with id ${req.params.id}`});
                res.json(serial);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));           
    }
);


router.post('/serials', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!common.checkSerialBody(req.body) || !req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }

        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }
            const newSerial = {
                title: req.body.title,
                seasonsNum: req.body.seasonsNum,
                mark: req.body.mark,
                description: req.body.description, 
                avaUrl: img.url,	
            };
            Serials.create(newSerial)
                .then(newSerial => res.status(201).json(newSerial)) 
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })   
    }
);

router.put('/serials/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Serials.patch(req.body, req.params.id) // returns old object
            .then(serial => {
                if(!serial) 
                    return Promise.reject({status: 404, error: `No serial with id ${req.params.id}`});  
                res.json(serial);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));         
    }
);

router.patch('/serials/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }
        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }
            Serials.updAvatar(req.params.id, img.url)
                .then(serial => res.json(serial)) 
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })         
    }
);

router.delete('/serials/:id',
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Serials.delete(req.params.id)
            .then(serial => {
                if (!serial) 
                    return Promise.reject({status: 404, error: `No serial with id ${req.params.id}`});
                res.json(serial);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

/* 
    API from SERIESES
*/

function basicAuth(req, res, next) {
    // if there is not session user, try basic
    if (!req.user) { 
        const auth = passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'});
        return auth(req, res, next); 
    }
    next();
}
 
router.get('/serieses', basicAuth,
    (req, res) => {
        Serieses.getAll()
            .then(serieses => {                                                         
                const searchStr = req.query.search;
                if(searchStr) {
                    serieses = common.search(searchStr, serieses);
                    if(serieses.length === 0)  // not found						
                        return Promise.reject({status: 404, error: `No serieses for "${searchStr}" request`, max: 1});                        
                }
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(serieses);
                serieses = common.pagination(serieses, pageNumber)                			
                if(!serieses || serieses.length === 0)                     
                    return Promise.reject({status: 404, error: `No serieses`, page: pageNumber, max: maxPage});                                
                res.json({items: serieses, max: maxPage});
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get('/serials/:sId/serieses', basicAuth,
    (req, res) => {
        Serials.getById(req.params.sId)
            .then(serial => {     
                if(!serial)
                    return Promise.reject({status: 404, error: `No serial with id ${req.params.sId}`, max: 1});
                let serieses = serial.serieses;
                const searchStr = req.query.search;
                if(searchStr) {
                    serieses = common.search(searchStr, serieses);
                    if(serieses.length === 0)  // not found						
                        return Promise.reject({status: 404, error: `No serieses for "${searchStr}" request`, max: 1});                        
                }
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(serieses);
                serieses = common.pagination(serieses, pageNumber);              			
                if(!serieses || serieses.length === 0) 
                    return Promise.reject({status: 404, error: `No serieses`, page: pageNumber, max: 1});
                res.json({items: serieses, max: maxPage});
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/serieses/:id",
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        Serieses.getById(req.params.id)
            .then(series => {
                if(!series )
                    return Promise.reject({status: 404, error: `No series with id ${req.params.id}`});
                res.json(series);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.post('/serials/:sId/serieses',
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!common.checkSeriesBody(req.body) || !req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }

        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }   
            const newSeries = {
                title: req.body.title,
				seasonNumber: req.body.seasonNumber,
				seriesNumber: req.body.seriesNumber,
				mark: req.body.mark,
				description: req.body.description, 
				avaUrl: img.url,	
				videoLink: req.body.videoLink,
				serialId: req.params.sId	
            };

            Serieses.create(newSeries)
                .then(newSeries => Promise.all([Serials.addSeries(newSeries), newSeries]))  // save id of added series to serial
                .then(result => res.status(201).json(result[1]))                
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })
    }
);

router.put('/serieses/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }        
        Serieses.patch(req.body, req.params.id)
            .then(series => {
                if(!series) 
                    return Promise.reject({status: 404, error: `No series with id ${req.params.id}`});  
                res.json(series);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));                     
    }
);

router.patch('/serieses/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }
        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }
            Serieses.updAvatar(req.params.id, img.url)
                .then(series => res.json(series)) 
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })         
    }
);

router.delete('/serieses/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Serieses.delete(req.params.id)
            .then(series => {
                if(!series)
                    return Promise.reject({status: 404, error: `No series with id ${req.params.id}`});                  
                return Promise.all([Serials.removeSeries(series.serialId.toString(), series.id), series])
            })
            .then(result => res.json(result[1]))
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/unauthorized", (req, res) => {
    console.log("unauthorized!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.status(401).json({status: 401, error: "Not authorized"});
});

module.exports = router;