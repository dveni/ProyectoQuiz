var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var partials = require('express-partials');
var indexRouter = require('./routes/index');
var methodOverride = require('method-override');
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var flash = require('express-flash');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method', {methods: ["POST","GET"]}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());

// Session configuration to be stored in DB with Sequelize
var sequelize = require("./models");
var sessionStore = new SequelizeStore({
	db: sequelize,
	table: "session",
	checkExpirationInterval: 15*60*1000,
	expiration: 4*60*60*1000
});
app.use(session({
	secret: "Quiz 2018",
	store: sessionStore,
	resave: false,
	saveUninitalized: true
}));
app.use(flash());


app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
