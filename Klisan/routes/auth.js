const express = require('express');
const config = require('../config');

const busboyBodyParser = require('busboy-body-parser');
const bodyParser = require('body-parser');

const Users = require('../models/user');
const passport = require('passport');
const crypto = require('crypto');

const router = express.Router();
router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
router.use(busboyBodyParser({ limit: '20mb' }));

router.get('/register', (req, res) => {
    let data = {};
    if (req.query.err){
        data.err = req.query.err;  // output error of input
    }
    res.render('register', data);
});

router.get('/checkLogin',
    (req, res) => {
        Users.getByLogin(req.query.login)
            .then(user => {     
                if(!user)                                
                    res.json({isUnique: true});
                else
                    res.json({isUnique: false});
            })
            .catch(err => res.status(404).json(err));
    }
);

router.post('/register', (req, res) => {
    if(req.user) { // if user already auth.
        res.redirect(`users/${user.id}`);
        return;
    }
    const hash = crypto.createHmac('sha512', config.ServerSalt);
    hash.update(req.body.pass1);
    let password = hash.digest('hex');    
    Users.getByLogin(req.body.login)
        .then(user => {
            if (!user) {
                const user = {
                    login: req.body.login,
                    password: password,                                        
                    fullname: req.body.fullname,                                        
                    avaUrl: "/images/user.png"
                  };
                return Users.create(user);           
            }
            return Promise.reject(`Login ${req.body.login} already exists`);
        })
        .then(()  => res.render('login'))
        .catch(() => res.redirect('/auth/register?err=Login+already+exists')); 
});

router.get('/login', (req, res) => {
    if(req.user) // if user already auth.
        res.redirect(`/users/${req.user.id}`);
    else
        res.render('login');
});

router.post('/login',
	passport.authenticate('local', { failureRedirect: '/auth/login' }),  
        (req, res) => res.redirect('/'));

router.get('/logout', 
    (req, res) => {
    	req.logout();   
    	res.redirect('/');
    });



module.exports = router;