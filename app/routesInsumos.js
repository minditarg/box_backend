
var general = require('./functionsGeneral');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
  extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app, connection, passport, io) {


  app.get('/list-insumos/:idinsumo', isLoggedIn, function (req, res) {
    var idInsumo = parseInt(req.params.idinsumo) || null;

    connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias  WHERE i.activo=1 && i.id = ?", [idInsumo], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });


  app.get('/list-insumos-sin-cantidad', isLoggedIn, function (req, res) {

    connection.query("SELECT i.id, i.descripcion, i.activo, i.unidad, i.minimo, ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE activo=1", function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });

    })


  });

  app.get('/list-insumos', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.activo=1", function (err, result) {
      if (err) return res.status(500).send(err);

      res.json({ success: 1, result });
    })
  });

  app.get('/list-insumos-movimientos', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {

    connection.query("CALL insumos_listar_movimientos()", function (err, result) {
      if (err) return res.status(500).send(err);

      res.json({ success: 1, result: result[0] });
    })

  });

  app.get('/list-insumos-alertados', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    connection.query("call insumos_listar_alertados()", function (err, result) {


      //connection.query("call update_insumos_costo(?)", [[req.body.costo, new Date(), id_insumo, userId]], function (err, result) {

      // connection.query("SELECT i.id_insumos_categorias, i.numero, i.descripcion, i.activo, i.unidad, i.minimo, i.cantidad, i.costo, i.fecha_actualizacion_costo, i.alertar, i.autorizar, ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.activo=1 and i.alertar = 1 and i.fecha_actualizacion_costo <= DATE_SUB(NOW(), INTERVAL 30 DAY)", function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });

  app.get('/list-insumos-stock-insuficiente', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    connection.query("call insumos_listar_stock_insuficiente()", function (err, result) {


      //connection.query("call update_insumos_costo(?)", [[req.body.costo, new Date(), id_insumo, userId]], function (err, result) {

      // connection.query("SELECT i.id_insumos_categorias, i.numero, i.descripcion, i.activo, i.unidad, i.minimo, i.cantidad, i.costo, i.fecha_actualizacion_costo, i.alertar, i.autorizar, ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.activo=1 and i.alertar = 1 and i.fecha_actualizacion_costo <= DATE_SUB(NOW(), INTERVAL 30 DAY)", function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });


  app.get('/select-insumos/:id', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    let id = parseInt(req.params.id) || null;

    connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.id=?", [id], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })


  });


  app.post('/delete-insumos', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [22], connection) }, function (req, res) {

    var idUser = null;
    if (req.user)
      idUser = req.user.id;

    //connection.query("UPDATE insumos set activo = 0 where id = ?", [req.body.id], function (err, result) {
    connection.query("CALL insumos_eliminar(?)", [[req.body.id, idUser]], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })

  });


  app.post('/insert-categorias', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [21], connection) }, function (req, res) {
    let codigo = req.body.codigo || null;
    let descripcion = req.body.descripcion || null;
    var arrayIns = [codigo, descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })

  });

  app.post('/insert-insumos', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [22], connection) }, function (req, res) {
    var idUser = null;
    if (req.user)
      idUser = req.user.id;

    let categoria = parseInt(req.body.categoria) || null;
    let numero = parseInt(req.body.numero) || null;
    let descripcion = req.body.descripcion || null;
    let unidad = req.body.unidad || null;
    let minimo = parseInt(req.body.minimo) || 0;
    let alertar = parseInt(req.body.alertar) || 0;
    let autorizar = parseInt(req.body.autorizar) || 0;


    var arrayIns = [categoria, numero, descripcion, unidad, minimo, alertar, autorizar, idUser];


    connection.query("SELECT * FROM insumos WHERE id_insumos_categorias = ? AND numero = ?", [req.body.categoria, req.body.numero], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al chequear duplicidad de insumos", err });
      else {
        if (result.length > 1) {
          return res.json({ success: 0, error_msj: "No se puede guardar, código ya utilizado. Ingrese otro.", err });
        }
        else {
          connection.query("CALL insumos_crear(?)", [arrayIns], function (err, result) {

            if (err) return res.status(500).send(err);
            res.json({ success: 1, result });
          })
        }

      }

    })


  });


  app.post('/update-insumos-costos', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [23], connection) }, function (req, res) {
    var userId = null;
    if (req.user)
      userId = req.user.id;

    let id = parseInt(req.body.id) || null
    let costo = parseFloat(req.body.costo) || 0;
    let fecha = new Date();

    if (id) {

      // var objectoUpdate = {costo: req.body.costo, fecha_actualizacion_costo: new Date()};
      // connection.query("UPDATE insumos SET ? where id = ?", [objectoUpdate, id_insumo], function (err, result) {
      //console.log("COSTO: " + req.body.costo);
      connection.query("call update_insumos_costo(?)", [[costo, fecha, id, userId]], function (err, result) {
        if (err) return res.status(500).send(err);

        res.json({ success: 1, result });

      });
    } else {
      res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })
    }
  });


  app.post('/update-insumos', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [22], connection) }, function (req, res) {
    var userId = null;
    if (req.user)
      userId = req.user.id;

    let id = parseInt(req.body.id) || null;
    let categoria = parseInt(req.body.categoria) || null;
    let numero = parseInt(req.body.numero) || null;
    let minimo = parseInt(req.body.minimo) || 0;
    let descripcion = req.body.descripcion || null;
    let unidad = req.body.unidad || null;
    let alertar = parseInt(req.body.alertar) || 0;
    let autorizar = parseInt(req.body.autorizar) || 0;


    if (id) {
      var id_insumo = parseInt(req.body.id);
      var arrayUpdate = [categoria, numero, id, minimo, descripcion, unidad, alertar, autorizar, userId];
      connection.query("CALL insumos_modificar(?)", [arrayUpdate], function (err, result) {
        if (err) return res.status(500).send(err);

        res.json({ success: 1, result });


      });
    } else {
      res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })

    }

  });


  app.get('/get-siguiente/:idcategoria', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    var idCategoria = parseInt(req.params.idcategoria) || null;
    connection.query("select max(numero) + 1 as siguiente FROM insumos where id_insumos_categorias = ?", [idCategoria], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });



  app.post('/insert-categorias', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [21], connection) }, function (req, res) {
    let codigo = req.body.codigo || null;
    let descripcion = req.body.descripcion || null;

    var arrayIns = [codigo,descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })

  });

  app.get('/list-categorias', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    connection.query("SELECT * FROM insumos_categorias WHERE activo=1", function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });

  app.post('/delete-categorias', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [21], connection) }, function (req, res) {
    let id = parseInt(req.body.id) || null;
    connection.query("UPDATE insumos_categorias set activo = 0 where id = ?", [id], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });

  app.get('/list-categorias/:idcategoria', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
    var idCategoria = parseInt(req.params.idcategoria) || null;
    connection.query("SELECT * FROM insumos_categorias WHERE activo=1 && id = ?", [idCategoria], function (err, result) {
      if (err) return res.status(500).send(err);
      res.json({ success: 1, result });
    })
  });

  app.post('/update-categorias', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [21], connection) }, function (req, res) {
    let id = parseInt(req.body.id) || null;
    let codigo = req.body.codigo || null;
    let descripcion = req.body.descripcion || null;

    if (id) {
      var objectoUpdate = { codigo: codigo, descripcion: descripcion };
      connection.query("UPDATE insumos_categorias SET ? where id = ?", [objectoUpdate, id], function (err, result) {
        if (err) return res.status(500).send(err);
        res.json({ success: 1, result });
      });
    } else {
      res.json({ success: 0, error_msj: "el id de la tabla insumos_categorias no esta ingresado" })

    }

  });



  function checkConnection(req, res, next) {
    console.log(connection.state);
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }

  function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
      return next();
    // if they aren't redirect them to the home page
    res.status(401).send("No inició sesión en la aplicación");
  }





}
