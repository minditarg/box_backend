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

  app.get('/list-entregas', checkConnection,function (req, res) {

      connection.query("SELECT u.*,m.*,e.*,m.descripcion as mdescripcion FROM entregas e LEFT JOIN users u ON e.id_user=u.id LEFT JOIN modulos m ON m.id = e.id_modulo  WHERE e.activo=1 ORDER BY e.id DESC", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })

  });

   app.get('/list-entregas-detalles/:idEntrega/:cantidad', checkConnection,function (req, res) {
     var idEntrega = parseInt(req.params.idEntrega);
     var cantidad = parseInt(req.params.cantidad);
      connection.query("SELECT ed.cantidad,i.codigo,i.descripcion,i.unidad FROM entregas_detalles ed INNER JOIN insumos i ON i.id = ed.id_insumo WHERE ed.id_entrega = ? LIMIT ?",[idEntrega,cantidad], function (err, result) {
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


  app.post('/insert-entregas', bodyJson,checkConnection, function (req, res) {


      connection.beginTransaction(function (err) {
        if (err) { throw err; }
        var datenow = new Date();
				var userId = null;
				if(req.user)
				userId = req.user.id;
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
        var arrayIns = [req.body.descripcion,req.body.id_modulo,userId,datenow];
				var arrayAtrib = ["decripcion","id_modulo","id_user","fecha"];
        connection.query("INSERT INTO entregas (descripcion,id_modulo,id_user,fecha) VALUES (?)", [arrayIns], function (error, result) {
          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }

          var insertedEntrega = result.insertId;

          var sql = "INSERT INTO entregas_detalles (id_entrega, id_insumo, cantidad, activo) VALUES ?";
          var values = [];
          req.body.detalle.forEach(element => {
            values.push([insertedEntrega, element.id, element.cantidad, 1]);
          });

          connection.query(sql, [values], function (error, results) {

            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            var sql = "INSERT INTO auditoria_stock (id_movimiento,cantidad,id_user,fecha,id_entrega,id_insumo) VALUES ?";
            var values = [];
            req.body.detalle.forEach(element => {
              values.push([2, element.cantidad, userId, new Date(), insertedEntrega, element.id]);
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
