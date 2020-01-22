var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app,connection, passport,io) {

  app.get('/detalle-pedido/:idpedido', checkConnection,function (req, res) {
    var idPedido = req.params.idpedido;
      connection.query("SELECT p.*, i.id, i.descripcion, i.unidad, CONCAT(ic.codigo, i.numero) as identificador FROM pedidos p INNER JOIN insumos i ON p.id_insumo = i.id inner join insumos_categorias ic on ic.id = i.id_insumos_categorias WHERE p.id= ?", [idPedido], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })
  });


  app.get('/list-pedidos-sin-cantidad',checkConnection, function (req, res) {

      connection.query("SELECT i.id, i.descripcion, i.activo, i.unidad, i.minimo, ic.codigo FROM pedidos i LEFT JOIN pedidos_categorias ic ON ic.id = i.id_pedidos_categorias WHERE activo=1", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })


  });

  app.get('/list-pedidos',checkConnection, function (req, res) {
      connection.query("SELECT p.id as identificador, p.fecha, u.username FROM boxrental.pedidos p inner join users u on p.id_usuario = u.id ORDER BY p.id DESC", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });

        res.json({ success: 1, result });
      })
  });

  app.get('/list-pedidos-alertados',checkConnection, function (req, res) {
    connection.query("call pedidos_listar_alertados()", function (err, result) {


      //connection.query("call update_pedidos_costo(?)", [[req.body.costo, new Date(), id_pedido, userId]], function (err, result) {

    // connection.query("SELECT i.id_pedidos_categorias, i.numero, i.descripcion, i.activo, i.unidad, i.minimo, i.cantidad, i.costo, i.fecha_actualizacion_costo, i.alertar, i.autorizar, ic.codigo FROM pedidos i LEFT JOIN pedidos_categorias ic ON ic.id = i.id_pedidos_categorias WHERE i.activo=1 and i.alertar = 1 and i.fecha_actualizacion_costo <= DATE_SUB(NOW(), INTERVAL 30 DAY)", function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })
});


  app.get('/select-pedidos/:id', checkConnection,function (req, res) {

      connection.query("SELECT i.*,ic.codigo FROM pedidos i LEFT JOIN pedidos_categorias ic ON ic.id = i.id_pedidos_categorias WHERE i.id=?", [req.params.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })


  });


  app.post('/delete-pedidos', bodyJson,checkConnection, function (req, res) {

      connection.query("UPDATE pedidos set activo = 0 where id = ?", [req.body.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })

  });


//   app.post('/insert-categorias', bodyJson,checkConnection, function (req, res) {

//     var arrayIns = [req.body.codigo, req.body.descripcion];
//     connection.query("INSERT INTO pedidos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

//       if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un pedido", err });
//       res.json({ success: 1, result });
//     })

// });

  // app.post('/insert-pedidos', bodyJson,checkConnection, function (req, res) {
	// 	var idUser = null;
	// 	if(req.user)
  //     idUser = req.user.id;

  //     var arrayIns = [req.body.detalle[0].id, req.body.detalle[0].cantidad, idUser];

  //     connection.query("CALL pedidos_crear(?)", [arrayIns], function (err, result) {
  //       if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar crear un pedido", err });
  //       res.json({ success: 1, result });
  //     })

  //     });

  app.post('/insert-pedidos', bodyJson, checkConnection, function (req, res) {

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
        var arrayIns = [userId];
        connection.query("CALL pedidos_crear(?)", [arrayIns], function (err, result) {
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
      let sql = "CALL pedidos_agregar_insumo(?)";

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



  app.post('/update-pedidos', bodyJson,checkConnection, function (req, res) {
			// var userId = null;
			// if(req.user)
			//   userId = req.user.id;

    console.log("entrooo " + req.body.idPedido);

      if (req.body.detalle[0].id) {

        var arrayUpdate = [req.body.idPedido, req.body.detalle[0].id, req.body.detalle[0].cantidad];
      //  var arrayUpdate = [req.body.categoria,req.body.numero,req.body.id,req.body.minimo,req.body.descripcion,req.body.unidad, req.body.alertar, req.body.autorizar, userId];
        connection.query("CALL pedidos_modificar(?)", [arrayUpdate], function (err, result) {
          if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar pedido", err });

					res.json({ success: 1, result });


        });
      } else {
        res.json({ success: 0, error_msj: "el id de la tabla pedido no esta ingresado" })

      }

  });


  app.get('/get-siguiente/:idcategoria',checkConnection, function (req, res) {
    var idCategoria = req.params.idcategoria;
    connection.query("select max(numero)+1 as siguiente FROM boxrental.pedidos where id_pedidos_categorias = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })
  });


/*
  app.post('/insert-categorias', bodyJson,checkConnection, function (req, res) {

    var arrayIns = [req.body.codigo, req.body.descripcion];
    connection.query("INSERT INTO pedidos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un pedido", err });
      res.json({ success: 1, result });
    })

});

app.get('/list-categorias',checkConnection, function (req, res) {
  connection.query("SELECT * FROM pedidos_categorias WHERE activo=1", function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.post('/delete-categorias', bodyJson,checkConnection, function (req, res) {
  connection.query("UPDATE pedidos_categorias set activo = 0 where id = ?", [req.body.id], function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.get('/list-categorias/:idcategoria', checkConnection,function (req, res) {
  var idCategoria = req.params.idcategoria;
    connection.query("SELECT * FROM pedidos_categorias WHERE activo=1 && id = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ suidcategoriaccess: 0, error_msj: err });
      res.json({ success: 1, result });
    })
});

app.post('/update-categorias', bodyJson,checkConnection, function (req, res) {

  if (req.body.id) {
    var id_pedido = parseInt(req.body.id);
    var objectoUpdate = { codigo: req.body.codigo, descripcion: req.body.descripcion };
    connection.query("UPDATE pedidos_categorias SET ? where id = ?", [objectoUpdate, id_pedido], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar pedido", err });
      res.json({ success: 1, result });
    });
  } else {
    res.json({ success: 0, error_msj: "el id de la tabla pedidos_categorias no esta ingresado" })

  }

});

*/

  function checkConnection(req,res,next) {
    console.log(connection.state);
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }



}
