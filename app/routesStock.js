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
    connection.query("CALL insumos_ajustar(?)", [[req.body.codigo,req.body.cantidad, userId]], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });

  app.get('/detalle-stock/:idInsumo/:cantidadRegistros', checkConnection, function (req, res) {
    var idInsumo = req.params.idInsumo;
    var cantidadRegistros = parseInt(req.params.cantidadRegistros);
    connection.query("SELECT m.descripcion,m.descripcion_id, u.username,aus.id_movimiento,aus.fecha, aus.cantidad,aus.id_ingreso,aus.id_entrega,aus.id_devolucion,aus.minimo,aus.parcial,i.referencia FROM insumos_movimientos as aus LEFT JOIN ingresos as i ON aus.id_ingreso = i.id LEFT JOIN movimientos as m ON aus.id_movimiento = m.id LEFT JOIN users as u ON u.id = aus.id_user   WHERE aus.id_insumo = ? ORDER BY aus.id DESC LIMIT ?", [idInsumo, cantidadRegistros], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });

  app.get('/list-movimientos-stock', checkConnection, function (req, res) {

    connection.query("CALL insumos_listar_movimientos_stock()", function (err, result) {
      if (err) return res.state(500).send("error de consulta SQL");
      res.json({ success: 1, result:result[0] });
    })

  });


  function checkConnection(req, res, next) {
    console.log(connection.state);
     // connection = mysql.createConnection(dbconfig.connection);



    next();

  }


}
