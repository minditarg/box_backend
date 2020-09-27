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

  app.get('/list-devoluciones', checkConnection, function (req, res) {

    connection.query("SELECT u.*,m.*,d.*,m.descripcion as mdescripcion, mov.descripcion_id FROM devoluciones d LEFT JOIN users u ON d.id_user=u.id LEFT JOIN modulos m ON m.id = d.id_modulo LEFT JOIN movimientos mov ON mov.id = d.id_movimiento  WHERE d.activo=1 ORDER BY d.id DESC", function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });

    })

  });


  app.get('/list-devoluciones-insumos-modulo/:idModulo', checkConnection, function (req, res) {
    let idModulo = req.params.idModulo;
    connection.query("CALL devoluciones_listar_insumos_modulo(?) ", [idModulo], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result: result[0] });

    })

  });

  app.get('/list-devoluciones-detalles/:idDevolucion/:cantidad', checkConnection, function (req, res) {
    var idDevolucion = parseInt(req.params.idDevolucion);
    var cantidad = parseInt(req.params.cantidad);
    connection.query("SELECT dd.cantidad,ic.codigo,i.numero,i.descripcion,i.unidad FROM devoluciones_detalles dd LEFT JOIN insumos i ON i.id = dd.id_insumo LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE dd.id_devolucion = ? LIMIT ?", [idDevolucion, cantidad], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });

    })

  });


  app.post('/delete-devoluciones', bodyJson, checkConnection, function (req, res) {

    connection.query("UPDATE devoluciones set activo = 0 where id = ?", [req.body.id], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });


  app.post('/insert-devoluciones', bodyJson, checkConnection, function (req, res) {

    /*
    connection.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        res.json({ success: 0, err });
      }
      */

    connection.beginTransaction(function (err) {
      if (err) {
        //  connection.release();
        res.json({ success: 0, err });
      }

      var userId = null;
      if (req.user)
        userId = req.user.id;
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
      var arrayIns = [req.body.id_modulo, req.body.motivo, req.body.referencia, userId];

      connection.query("CALL devoluciones_crear(?)", [arrayIns], function (error, result) {
        if (error) {
          return connection.rollback(function () {
            // connection.release();
            res.json({ success: 0, err });
          });
        }

        var insertedDevolucion = result[0][0].id_devolucion;
        var insertedModuloMovimiento = result[0][0].id_modulo_movimiento;



        var values = [];
        req.body.detalle.forEach(element => {
          values.push([insertedDevolucion, req.body.id_modulo, element.id_modulo_insumo, insertedModuloMovimiento, element.cantidad, userId]);
        });

        recorrerArrayAgregar(values, 0, connection, res, function () {




          connection.commit(function (err) {
            if (err) {
              return connection.rollback(function () {
                // connection.release();
                res.json({ success: 0, err });
              });
            }

            res.json({ success: 1 });
          });
        });
      });

      //});
    })
  });


  function recorrerArrayAgregar(array, index, connection, res, callback) {

    if (array.length > 0) {
      let sql = "CALL devoluciones_agregar_insumo(?)";

      connection.query(sql, [array[index]], function (err, results) {

        if (err) {
          return connection.rollback(function () {
           // connection.release();
            res.json({ success: 0, err });
          });
        }

        if (array.length > index + 1) {
          recorrerArrayAgregar(array, index + 1, connection, res, callback)
        }
        else {
          callback();
        }

      })
    } else {
      callback();
    }

  }



  function checkConnection(req, res, next) {
    console.log(connection.state);
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }


}
