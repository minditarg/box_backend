var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');

var bodyUrlencoded = bodyParser.urlencoded({
  extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app, connection, passport) {

  app.post('/ajuste-stock', bodyJson, checkConnection, function (req, res) {
    var userId = null;
    if (req.user && req.user.id)
      var userId = req.user.id;
    //console.log("req.body.cantidad ,req.body.id " + req.body.cantidad + " - " + req.body.id);
    connection.query("INSERT INTO auditoria_stock (id_movimiento, cantidad,id_user, id_insumo,fecha) VALUES (?,?,?,?,?)", [3, req.body.cantidad, userId, req.body.codigo, new Date()], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });

  app.get('/detalle-stock/:idInsumo/:cantidadRegistros', checkConnection, function (req, res) {
    var idInsumo = req.params.idInsumo;
    var cantidadRegistros = parseInt(req.params.cantidadRegistros);
    connection.query("SELECT m.descripcion, u.username,aus.id_movimiento,aus.fecha, aus.cantidad,i.identificador FROM auditoria_stock as aus LEFT JOIN ingresos as i ON aus.id_ingreso = i.id LEFT JOIN movimientos as m ON aus.id_movimiento = m.id LEFT JOIN users as u ON u.id = aus.id_user   WHERE aus.id_insumo = ? ORDER BY aus.id DESC LIMIT ?", [idInsumo, cantidadRegistros], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });


  function checkConnection(req, res, next) {
    if (connection.state === 'disconnected') {
      connection = mysql.createConnection(dbconfig.connection);
      connection.query('USE ' + dbconfig.database);
    }

    next();

  }


}
