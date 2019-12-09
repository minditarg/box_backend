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

  app.get('/list-devoluciones', checkConnection,function (req, res) {

      connection.query("SELECT u.*,m.*,d.*,m.descripcion as mdescripcion, mov.descripcion_id FROM devoluciones d LEFT JOIN users u ON d.id_user=u.id LEFT JOIN modulos m ON m.id = d.id_modulo LEFT JOIN movimientos mov ON mov.id = d.id_movimiento  WHERE d.activo=1 ORDER BY d.id DESC", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })

  });

   app.get('/list-devoluciones-detalles/:idDevolucion/:cantidad', checkConnection,function (req, res) {
     var idDevolucion = parseInt(req.params.idDevolucion);
     var cantidad = parseInt(req.params.cantidad);
      connection.query("SELECT dd.cantidad,ic.codigo,i.numero,i.descripcion,i.unidad FROM devoluciones_detalles dd LEFT JOIN insumos i ON i.id = dd.id_insumo LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE dd.id_devolucion = ? LIMIT ?",[idDevolucion,cantidad], function (err, result) {
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


  app.post('/insert-devoluciones', bodyJson,checkConnection, function (req, res) {


      connection.beginTransaction(function (err) {
        if (err) { throw err; }
        var datenow = new Date();
				var userId = null;
				if(req.user)
				userId = req.user.id;
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [req.body.referencia,req.body.comentario,req.body.id_modulo,userId,datenow];

        connection.query("INSERT INTO devoluciones (referencia,comentario,id_modulo,id_user,fecha) VALUES (?)", [arrayIns], function (error, result) {
          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }

          var insertedDevolucion = result.insertId;

          var sql = "INSERT INTO devoluciones_detalles (id_devolucion, id_insumo, cantidad, activo) VALUES ?";
          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedDevolucion, element.id, element.cantidad, 1]);
          });

          connection.query(sql, [values], function (error, results) {

            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            var sql = "INSERT INTO insumos_movimientos (id_movimiento,cantidad,id_user,fecha,id_devolucion,id_insumo) VALUES ?";
            var values = [];
            req.body.detalle.forEach(element => {
              values.push([4, element.cantidad, userId, new Date(), insertedDevolucion, element.id]);
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
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }


}
