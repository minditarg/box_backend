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
        res.json({ success: 5, err });
      }


      connection.beginTransaction(function (err) {
        if (err) {
          connection.release();
          res.json({ success: 5, err });
        }
        var datenow = new Date();
        var userId = null;
        if (req.user)
          userId = req.user.id;
        //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [req.body.referencia, req.body.comentario, req.body.id_modulo, userId, datenow];
        var arrayAtrib = ["referencia", "comentario", "id_modulo", "id_user", "fecha"];
        connection.query("INSERT INTO entregas (referencia,comentario,id_modulo,id_user,fecha) VALUES (?)", [arrayIns], function (err, result) {
          if (err) {
            return connection.rollback(function () {
              connection.release();
              res.json({ success: 5, err });
            });
          }

          var insertedEntrega = result.insertId;


          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedEntrega,element.id, element.cantidad, userId ]);
          });

          recorrerArrayAgregar(values,0,connection, res,function(){

          


            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  connection.release();
                  res.json({ success: 5, err });
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
      let sql = "CALL insumos_entregar(?)";

      connection.query(sql, [array[index]], function (err, results) {

        if (err) {
          return connection.rollback(function () {
            connection.release();
            res.json({ success: 5, err });
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
