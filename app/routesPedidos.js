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


  app.post('/insert-pedido', bodyJson, checkConnection, function (req, res) {
    connection.getConnection(function(err, connection) {
      if (err) {
        connection.release();
        throw err; }

    connection.beginTransaction(function (err) {
      if (err) {
        connection.release();
        throw err; }
      var datenow = new Date();
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
      var arrayIns = [req.body.referencia, 1];
      connection.query("INSERT INTO pedidos (referencia, activo) VALUES (?,1)", arrayIns, function (error, result) {
        if (error) {
          return connection.rollback(function () {
            connection.release();
            throw error;
          });
        }

        var insertedId = result.insertId;

        var sql = "INSERT INTO pedidos_insumos (id_pedido, id_insumo, cantidad, activo) VALUES ?";
        var values = [];
        req.body.detalle.forEach(element => {
          values.push([insertedId, element.id, element.cantidad, 1]);
        });
        connection.query(sql, [values], function (error, results) {

          if (error) {
            return connection.rollback(function () {
              connection.release();
              throw error;
            });
          }

          connection.commit(function (err) {
            if (err) {
              return connection.rollback(function () {
                connection.release();
                throw err;
              });
            } else {

            res.json({ success: 1, results });
              connection.release();
          }
          });
        });
      });

    });

  })

  });



  app.post('/update-pedido', bodyJson, checkConnection, function (req, res) {

    connection.getConnection(function(err, connection) {
      if (err) {
        connection.release();
        throw err; }
    connection.beginTransaction(function (err) {
      if (err) {
        connection.release();
        throw err; }
      var datenow = new Date();
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
      //var arrayIns = [req.body.codigo, req.body.descripcion, 1];
      var updObj = {
       // codigo: req.body.codigo,
        referencia: req.body.referencia
      }
      connection.query("UPDATE pedidos SET ? WHERE id = ?", [updObj, req.body.id], function (error, result) {
        if (error) {
          return connection.rollback(function () {
            connection.release();
            throw error;
          });
        }

        connection.query("DELETE FROM pedidos_insumos WHERE id_pedido = ?", req.body.id, function (error, result) {
          if (error) {
            return connection.rollback(function () {
              connection.release();
              throw error;
            });
          }

          var sql = "INSERT INTO pedidos_insumos (id_pedido, id_insumo, cantidad, activo) VALUES ?";
          var values = [];
          req.body.detalle.forEach(element => {
            values.push([req.body.id, element.id, element.cantidad, 1]);
          });
          connection.query(sql, [values], function (error, results) {

            if (error) {
              return connection.rollback(function () {
                connection.release();
                throw error;
              });
            }

            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  connection.release();
                  throw err;
                });
              } else {
                connection.release();
              res.json({ success: 1, results });
            }
            });
          });
        });
      });
    });
  })
  });


  app.post('/update-pedido-alt', bodyJson, checkConnection, function (req, res) {

    connection.beginTransaction(function (err) {
      if (err) { throw err; }
      var datenow = new Date();
      //  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
      //var arrayIns = [req.body.codigo, req.body.descripcion, 1];
      var updObj = {
       // codigo: req.body.codigo,
        referencia: req.body.referencia
      }
      connection.query("UPDATE pedidos SET ? WHERE id = ?", [updObj, req.body.id], function (error, result) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }




        var values = [];
        recorrerArray(req.body.detalle, 0, req.body.id, function () {


          connection.commit(function (err) {
            if (err) {
              return connection.rollback(function () {
                throw err;
              });
            }

            res.json({ success: 1 });
          });




        })



      });
    });

  });


  function recorrerArray(array, index, id, callback) {

    if (array.length > 0) {
      let sql;
      let insertar;
      if(array[index].tipoQuery == "INSERT")
      {
      sql = "INSERT INTO pedidos_insumos (id_pedido, id_insumo, cantidad, activo) VALUES (?)";
      insertar = [id, array[index].id, array[index].cantidad, 1];
      }
        if(array[index].tipoQuery == "UPDATE")
      {
      sql = "UPDATE pedidos_insumos set ? where id = ? ";
      insertar = {id_pedido:id, id_insumo:array[index].id, cantidad:array[index].cantidad,activo: 1};
      console.log(array[index]);
      }
      connection.query(sql, [insertar,array[index].id_pi], function (error, results) {

        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }

        if (array.length > index + 1) {
          recorrerArray(array, index + 1, id, callback)
        }
        else {
          callback();
        }

      })
    } else {
      callback();
    }

  }




  app.get('/list-pedidos', checkConnection, function (req, res) {

    try {
      connection.query("SELECT * FROM pedidos WHERE activo = 1 ORDER BY id DESC", function (err, result) {
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

  app.get('/list-pedidos-insumos/:idPlantilla', checkConnection, function (req, res) {
    var idPlantilla = req.params.idPlantilla;

    connection.query("SELECT * FROM pedidos p  WHERE p.activo = 1 AND p.id = ? ", [idPlantilla], function (err, resultPlantilla) {
      if (err) return res.json({ success: 0, error_msj: err });

      connection.query("SELECT i.*,pi.cantidad,pi.id as id_pedidos_insumos,ic.codigo FROM pedidos_insumos pi LEFT JOIN insumos i ON i.id = pi.id_insumo LEFT JOIN insumos_categorias ic ON i.id_insumos_categorias = ic.id  WHERE pi.activo = 1 AND pi.id_pedido = ? ", [idPlantilla], function (err, resultInsumos) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, pedido: resultPlantilla, insumos: resultInsumos });

      })


    })

  });


  app.post('/delete-pedido', bodyJson, checkConnection, function (req, res) {
    try {
      connection.query("UPDATE pedidos set activo = 0 where id = ?", [req.body.id], function (err, result) {
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
