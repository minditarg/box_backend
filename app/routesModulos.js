var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var moment = require('moment');

var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app,connection, passport) {

  app.get('/list-modulos',checkConnection, function (req, res) {

    try {
      connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })
    } catch (e) {
      return res.status(500).send({
        error: true,
        message: e.message
      })
    }

  });


  app.post('/delete-modulos', bodyJson,checkConnection, function (req, res) {
    try {
      connection.query("UPDATE modulos set activo = 0 where id = ?", [req.body.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })
    } catch (e) {
      return res.status(500).send({
        error: true,
        message: e.message
      })
    }
  });


  function checkConnection(req,res,next) {
    if(connection.state === 'disconnected'){
     connection = mysql.createConnection(dbconfig.connection);
     connection.query('USE ' + dbconfig.database);
    }

    next();

  }


}
