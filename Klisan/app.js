const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const mongoose = require('mongoose');
const config = require('./config');
const crypto = require('crypto');
//
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const seriesRouter = require('./routes/series');
const serialsRouter = require('./routes/serial');
const authRouter = require('./routes/auth');
const devRouter = require('./routes/developer');
const apiRouter = require('./routes/api');

const Users = require('./models/user');
const Auth = require('./models/auth');

const app = express();
app.use(logger('dev'));

const viewsDir = path.join(__dirname, 'views');

const connectOptions = { useNewUrlParser: true };
mongoose.connect(config.DatabaseUrl, connectOptions)
	.then(() => console.log("MongoDB connected"))
	.catch(() => console.log("ERROR: MongoDB not connected"));

app.engine('mst', mustache(path.join(viewsDir, 'partials')));

// view engine setup
app.set('views', viewsDir);
app.set('view engine', 'mst');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(busboyBodyParser({ limit: '20mb' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// для авторизації 
function sha512(password, salt) {
	const hash = crypto.createHmac('sha512', salt);
	hash.update(password);
	const value = hash.digest('hex');
	return {
		salt: salt,
		passwordHash: value
	};
};
passport.use(new LocalStrategy((username, password, done) => {
	let hash = sha512(password, config.ServerSalt).passwordHash;
	Users.getByLoginAndPassword(username, hash)
		.then(user => {
			if (!user) return done(null, false);
			return done(null, user);
		})
		.catch(err => done(err, false));
}));

const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
	function (username, password, done) {
		let hash = sha512(password, config.ServerSalt).passwordHash;
		Users.getByLoginAndPassword(username, hash)
		.then(user => {
			if (!user) return done(null, false);
			return done(null, user);
		})
		.catch(err => done(err, false));	
	}
));

// визначає, яку інформацію зберігати у Cookie сесії
passport.serializeUser(function (user, done) {
	done(null, user._id);
});
// отримує інформацію (id) із Cookie сесії і шукає користувача, що їй відповідає
passport.deserializeUser(function (id, done) {
	Users.getById(id)
		.then(user => {
			if (!user) done("No user");
			else done(null, user);
		})
});
// new middleware
app.use(cookieParser());
app.use(session({
	secret: config.Secret,
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


/* plug in our */
app.use("/auth", authRouter);
app.use("/developer/v1", devRouter);
app.use("/api/v1", apiRouter);
app.use(indexRouter);
app.use(usersRouter);
app.use(seriesRouter);
app.use(serialsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send(err.message);
	//res.render('error');
});

module.exports = app;