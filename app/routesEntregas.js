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

  app.get('/list-entregas', checkConnection, function (req, res) {

    connection.query("SELECT u.*,m.*,e.*,m.descripcion as mdescripcion, mov.descripcion_id FROM entregas e LEFT JOIN users u ON e.id_user=u.id LEFT JOIN modulos m ON m.id = e.id_modulo LEFT JOIN movimientos mov ON mov.id = e.id_movimiento  WHERE e.activo=1 ORDER BY e.id DESC", function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });

    })

  });



  app.get('/list-entregas-insumos-modulo/:idModulo', checkConnection, function (req, res) {
    let idModulo = req.params.idModulo;
    connection.query("CALL entregas_listar_insumos_modulo(?) ",[idModulo], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result:result[0] });

    })

  });

  app.get('/list-entregas-detalles/:idEntrega/:cantidad', checkConnection, function (req, res) {
    var idEntrega = parseInt(req.params.idEntrega);
    var cantidad = parseInt(req.params.cantidad);
    connection.query("SELECT ed.cantidad,ic.codigo,i.numero,i.descripcion,i.unidad FROM entregas_detalles ed LEFT JOIN insumos i ON i.id = ed.id_insumo LEFT JOIN insumos_categorias ic ON i.id_insumos_categorias = ic.id WHERE ed.id_entrega = ? LIMIT ?", [idEntrega, cantidad], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });

    })

  });


  app.post('/delete-entregas', bodyJson, checkConnection, function (req, res) {

    connection.query("UPDATE entregas set activo = 0 where id = ?", [req.body.id], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })

  });


  app.post('/insert-entregas', bodyJson, checkConnection, function (req, res) {

    connection.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        res.json({ success: 0, err });
      }


      connection.beginTransaction(function (err) {
        if (err) {
          connection.release();
          res.json({ success: 0, err });
        }
        var datenow = new Date();
        var userId = null;
        if (req.user)
          userId = req.user.id;
        //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [req.body.id_modulo,req.body.referencia, req.body.comentario,userId];
        connection.query("CALL entregas_crear(?)", [arrayIns], function (err, result) {
          if (err) {
            return connection.rollback(function () {
              connection.release();
              res.json({ success: 0, err });
            });
          }

          var insertedEntrega = result[0][0].id_entrega;
          var insertedModuloMovimiento = result[0][0].id_modulo_movimiento;


          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedEntrega,req.body.id_modulo,element.id_modulo_insumo,insertedModuloMovimiento, element.cantidad, userId ]);
          });

          recorrerArrayAgregar(values,0,connection, res,function(){




            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  connection.release();
                  res.json({ success: 0, err });
                });
              }

              res.json({ success: 1 });
            });
          });
        });

      });
    })

  });


  function recorrerArrayAgregar(array, index, connection, res, callback) {

    if (array.length > 0) {
      let sql = "CALL entregas_agregar_insumo(?)";

      connection.query(sql, [array[index]], function (err, results) {

        if (err) {
          return connection.rollback(function () {
            connection.release();
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
    //connection = mysql.createConnection(dbconfig.connection);



    next();

  }


}
