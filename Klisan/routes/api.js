const express = require('express');

const passport = require('passport');
const crypto = require('crypto');
const router = express.Router();
const Users = require('../models/user');
const Serials = require('../models/serial');
const Episods = require('../models/episod');
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

router.get('/users', basicAuth,    
    (req, res) => {
        Users.getAll()
            .then(users => {     
                const nShow = 1;
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(users, nShow);
                users = common.pagination(users, pageNumber, nShow);
                if(!users || users.length === 0) 
                    return Promise.reject({status: 404, error: `No users`, page: pageNumber, max: 1});
                res.json({items: users, max: maxPage});
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
                const nShow = 2;
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(serials, nShow);
                serials = common.pagination(serials, pageNumber, nShow);                 			
                if(!serials || serials.length === 0) 
                    return Promise.reject({status: 404, error: `No serials`, page: pageNumber, max: 1});
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
    API from episods
*/

function basicAuth(req, res, next) {
    if (!req.user) { 
        const auth = passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'});
        return auth(req, res, next); 
    }
    next();
}
 
router.get('/episods', basicAuth,
    (req, res) => {
        Episods.getAll()
            .then(episods => {                                                         
                const searchStr = req.query.search;
                if(searchStr) {
                    episods = common.search(searchStr, episods);
                    if(episods.length === 0)  // not found						
                        return Promise.reject({status: 404, error: `No episods for "${searchStr}" request`, max: 1});                        
                }
                const nShow = 8;
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(episods, nShow);
                episods = common.pagination(episods, pageNumber, nShow);                			
                if(!episods || episods.length === 0)                     
                    return Promise.reject({status: 404, error: `No episods`, page: pageNumber, max: maxPage});                                
                res.json({items: episods, max: maxPage});
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get('/serials/:sId/episods', basicAuth,
    (req, res) => {
        Serials.getById(req.params.sId)
            .then(serial => {     
                if(!serial)
                    return Promise.reject({status: 404, error: `No serial with id ${req.params.sId}`, max: 1});
                let episods = serial.episods;
                const searchStr = req.query.search;
                if(searchStr) {
                    episods = common.search(searchStr, episods);
                    if(episods.length === 0)  // not found						
                        return Promise.reject({status: 404, error: `No episods for "${searchStr}" request`, max: 1});                        
                }
                const nShow = 8;
                const pageNumber = parseInt(req.query.page);
                const maxPage = common.getMaxPage(episods, nShow);
                episods = common.pagination(episods, pageNumber, nShow);              			
                if(!episods || episods.length === 0) 
                    return Promise.reject({status: 404, error: `No episods`, page: pageNumber, max: 1});
                res.json({items: episods, max: maxPage});
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/episods/:id",
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        Episods.getById(req.params.id)
            .then(episod => {
                if(!episod )
                    return Promise.reject({status: 404, error: `No episod with id ${req.params.id}`});
                res.json(episod);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.post('/serials/:sId/episods',
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        if(!common.checkepisodBody(req.body) || !req.files.ava) {
            res.status(400).json({status: 400, error: 'Bad request'});
            return;
        }

        common.uploadImage(req.files.ava.data, (error, img) => {
            if(error) {
                res.status(400).json({status: 400, error: 'Bad request'});
                return;
            }   
            const newEpisod = {
                title: req.body.title,
				seasonNumber: req.body.seasonNumber,
				episodNumber: req.body.episodNumber,
				mark: req.body.mark,
				description: req.body.description, 
				avaUrl: img.url,	
				videoLink: req.body.videoLink,
				serialId: req.params.sId	
            };

            Episods.create(newEpisod)
                .then(newEpisod => Promise.all([Serials.addEpisod(newEpisod), newEpisod]))  // save id of added episod to serial
                .then(result => res.status(201).json(result[1]))                
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })
    }
);

router.put('/episods/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }        
        Episods.patch(req.body, req.params.id)
            .then(episod => {
                if(!episod) 
                    return Promise.reject({status: 404, error: `No episod with id ${req.params.id}`});  
                res.json(episod);
            })
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));                     
    }
);

router.patch('/episods/:id', 
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
            Episods.updAvatar(req.params.id, img.url)
                .then(episod => res.json(episod)) 
                .catch(() => res.status(400).json({status: 400, error: 'Bad request'}));
        })         
    }
);

router.delete('/episods/:id', 
    passport.authenticate('basic', { session: false, failureRedirect: '/api/v1/unauthorized'}),
    (req, res) => {
        if(!Auth.checkAdminRights(req.user)) {
            res.status(403).json({status: 403, error: 'Forbidden'});
            return;
        }
        Episods.delete(req.params.id)
            .then(episod => {
                if(!episod)
                    return Promise.reject({status: 404, error: `No episod with id ${req.params.id}`});                  
                return Promise.all([Serials.removeEpisod(episod.serialId.toString(), episod.id), episod])
            })
            .then(result => res.json(result[1]))
            .catch(err => err.status ? res.status(err.status).json(err) 
                                     : res.status(404).json(err));
    }
);

router.get("/unauthorized", (req, res) => {
    res.status(401).json({status: 401, error: "Not authorized"});
});

module.exports = router;