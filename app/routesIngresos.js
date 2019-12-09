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

      connection.query("SELECT u.*,i.*,m.descripcion_id FROM ingresos i LEFT JOIN users u ON i.id_user=u.id LEFT JOIN movimientos m ON m.id = i.id_movimiento WHERE i.activo=1 ORDER BY i.id DESC", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })

  });

   app.get('/list-ingresos-detalles/:idIngreso/:cantidad', checkConnection,function (req, res) {
     var idIngreso = parseInt(req.params.idIngreso);
     var cantidad = parseInt(req.params.cantidad);
      connection.query("SELECT id.cantidad,ic.codigo,i.numero,i.descripcion,i.unidad FROM ingresos_detalles id LEFT JOIN insumos i ON i.id = id.id_insumo LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE id.id_ingreso = ? LIMIT ?",[idIngreso,cantidad], function (err, result) {
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
				var userId = null;
				if(req.user){
					userId = req.user.id;
				}
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [userId, req.body.referencia, req.body.proveedor, datenow,1 ,req.body.fechaReferencia];
        connection.query("INSERT INTO ingresos (id_user,referencia,proveedor,fecha,activo,fecha_referencia) VALUES (?,?,?,?,?,?)", arrayIns, function (error, result) {
          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }

          var insertedIngreso = result.insertId;

          var sql = "INSERT INTO ingresos_detalles (id_ingreso, id_insumo, cantidad, activo) VALUES ?";
          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedIngreso, element.id, element.cantidad, 1]);
          });

          connection.query(sql, [values], function (error, results) {

            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            var sql = "INSERT INTO insumos_movimientos (id_movimiento,cantidad,id_user,fecha,id_ingreso,id_insumo) VALUES ?";
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

    console.log(connection.state);
    //if(connection.state === 'disconnected'){
    // connection = mysql.createConnection(dbconfig.connection);

  //  }

    next();

  }


}
