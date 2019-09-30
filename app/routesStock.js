var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');

var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app,connection, passport) {

  app.post('/ajuste-stock', bodyJson,checkConnection, function (req, res) {

      //console.log("req.body.cantidad ,req.body.id " + req.body.cantidad + " - " + req.body.id);
      connection.query("INSERT INTO auditoria_stock (id_movimiento, cantidad, id_insumo) VALUES (?,?,?)", [3, req.body.cantidad ,req.body.codigo], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })

  });


  function checkConnection(req,res,next) {
    if(connection.state === 'disconnected'){
     connection = mysql.createConnection(dbconfig.connection);
     connection.query('USE ' + dbconfig.database);
    }

    next();

  }


}
