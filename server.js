// server.js

// set up ======================================================================
// get all the tools we need
var compression = require('compression');
var express  = require('express');
var session  = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var cookieParser = require('cookie-parser');
var path = require('path');
var morgan = require('morgan');
var app      = express();
var server = require('http').createServer(app);
//var io = require('socket.io')(server);
//io.on('connection', client => {
//  console.log("cliente conectado");
//  client.on('disconnect', () => { console.log("cliente desconectado") });
//});
var port     = process.env.PORT || 3600 ;

var passport = require('passport');
var flash    = require('connect-flash');

var mysql = require('mysql2');
var dbconfig = require('./config/database');
//var connection = mysql.createConnection(dbconfig.connection);
var connection = mysql.createPool({
  host: '50.63.166.215',
  user: 'matias',
  password: 'Holaardu',
  database: 'boxrental_deploy',
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0
})

var sessionStore = new MySQLStore({}, connection.promise());

var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();
var serverOne = 'http://localhost:3000'



// configuration ===============================================================
// connect to our database

require('./config/passport')(passport,connection); // pass passport for configuration


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// set up our express application
app.use(compression());
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)


app.set('view engine', 'ejs'); // set up ejs for templating
app.set('trust proxy', 1);
// required for passport
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: false,
  saveUninitialized: true,
  store: sessionStore
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
//app.use(express.static('public'));
app.use(function(req,res,next){
     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
})
// routes ======================================================================
//require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

require('./app/routesIngresos.js')(app,connection, passport);
require('./app/routesUsers.js')(app,connection, passport);
require('./app/routesInsumos.js')(app,connection, passport);
require('./app/routesStock.js')(app,connection, passport);
require('./app/routesModulos.js')(app,connection, passport);
require('./app/routesEntregas.js')(app,connection, passport);
require('./app/routesDevoluciones.js')(app,connection, passport);
require('./app/routesPlantillas.js')(app,connection, passport);
require('./app/routesConfiguracion.js')(app,connection, passport);
require('./app/routesPedidos.js')(app,connection, passport);

/////////////////////
//para development
app.all("/*", function(req, res) {

    apiProxy.web(req, res, {target: serverOne},function (e) {
    return res.status(500).send({
       error: true,
       message: e.message
    })})
});
//////////////////////
///////////////////////////
//para el server de produccion
/*
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
*/

// launch ======================================================================
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
//console.log('MindIT en el puerto ' + port);
/*
process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err)
    process.exit(1) //mandatory (as per the Node docs)
})
*/

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

