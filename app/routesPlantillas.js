var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var moment = require('moment');

var bodyUrlencoded = bodyParser.urlencoded({
  extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app, connection, passport) {


  app.post('/insert-plantilla', bodyJson, checkConnection, function (req, res) {

    connection.beginTransaction(function (err) {
      if (err) { throw err; }
      var datenow = new Date();
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
      var arrayIns = [req.body.codigo, req.body.descripcion, 1];
      connection.query("INSERT INTO plantillas (codigo, descripcion, activo) VALUES (?,?,?)", arrayIns, function (error, result) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }

        var insertedId = result.insertId;

        var sql = "INSERT INTO plantillas_insumos (id_plantilla, id_insumo, cantidad_asignada, activo) VALUES ?";
        var values = [];
        req.body.detalle.forEach(element => {
          values.push([insertedId, element.id, element.cantidad, 1]);
        });
        connection.query(sql, [values], function (error, results) {

          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }

          connection.commit(function (err) {
            if (err) {
              return connection.rollback(function () {
                throw err;
              });
            }

            res.json({ success: 1, results });
          });
        });
      });

    });

  });




  app.get('/list-plantillas', checkConnection, function (req, res) {

    try {
      connection.query("SELECT * FROM plantillas WHERE activo = 1 ORDER BY id DESC", function (err, result) {
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

  app.get('/list-plantillas-insumos/:idPlantilla', checkConnection, function (req, res) {
    var idPlantilla = req.params.idPlantilla;
    try {
      connection.query("SELECT pi.*,i.* FROM plantillas_insumos pi LEFT JOIN insumos i ON i.id = pi.id_insumo  WHERE pi.activo = 1 AND pi.id_plantilla = ? ",[idPlantilla], function (err, result) {
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


  app.post('/delete-plantilla', bodyJson, checkConnection, function (req, res) {
    try {
      connection.query("UPDATE plantillas set activo = 0 where id = ?", [req.body.id], function (err, result) {
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


  function checkConnection(req, res, next) {
    console.log(connection.state);
    //  connection = mysql.createConnection(dbconfig.connection);
      


    next();

  }


}
