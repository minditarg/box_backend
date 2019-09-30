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

  app.get('/list-ingresos', checkConnection,function (req, res) {


      connection.query("SELECT * FROM ingresos i INNER JOIN users u ON i.id_user=u.id WHERE i.activo=1 ORDER BY i.id DESC", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })



  });


  app.post('/delete-ingresos', bodyJson, checkConnection, function (req, res) {

      connection.query("UPDATE ingresos set activo = 0 where id = ?", [req.body.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })

  });


  app.post('/insert-ingresos', bodyJson,checkConnection, function (req, res) {


      connection.beginTransaction(function (err) {
        if (err) { throw err; }
        var datenow = new Date();
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [, 1, req.body.identificador, req.body.proveedor, datenow, 1,req.body.fechaIdentificador];
        connection.query("INSERT INTO ingresos VALUES (?,?,?,?,?,?,?)", arrayIns, function (error, result) {
          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }

          var insertedIngreso = result.insertId;

          var sql = "INSERT INTO ingresos_detalles (id_ingreso, id_insumo, unidad, cantidad, activo) VALUES ?";
          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedIngreso, element.id, 99, element.cantidad, 1]);
          });

          connection.query(sql, [values], function (error, results) {

            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            var sql = "INSERT INTO auditoria_stock (id_movimiento,cantidad,id_user,fecha,id_ingreso,id_insumo) VALUES ?";
            var values = [];
            req.body.detalle.forEach(element => {
              values.push([1, element.cantidad, null, new Date(), insertedIngreso, element.id]);
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

  });


  function checkConnection(req,res,next) {
    if(connection.state === 'disconnected'){
     connection = mysql.createConnection(dbconfig.connection);
     connection.query('USE ' + dbconfig.database);
    }

    next();

  }


}
