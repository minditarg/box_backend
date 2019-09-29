// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');

var morgan = require('morgan');
var app      = express();
var port     = process.env.PORT || 3600 ;

var passport = require('passport');
var flash    = require('connect-flash');

var mysql = require('mysql');
var dbconfig = require('./config/database');
var connection = mysql.createConnection(dbconfig.connection);

var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();
var serverOne = 'http://localhost:3000'



// configuration ===============================================================
// connect to our database

require('./config/passport')(passport); // pass passport for configuration


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static('public'));

// routes ======================================================================
//require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

connection.query('USE ' + dbconfig.database);
require('./app/routesIngresos.js')(app,connection, passport);
require('./app/routesUsers.js')(app,connection, passport);
require('./app/routesInsumos.js')(app,connection, passport);
require('./app/routesStock.js')(app,connection, passport);


app.all("/*", function(req, res) {

    apiProxy.web(req, res, {target: serverOne},function (e) {
    return res.status(500).send({
       error: true,
       message: e.message
    })})
});

// launch ======================================================================
app.listen(port);
console.log('MindIT en el puerto ' + port);
process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err)
    process.exit(1) //mandatory (as per the Node docs)
})
