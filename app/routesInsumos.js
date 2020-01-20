
var general = require('./functionsGeneral');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app,connection, passport,io) {


  app.get('/list-insumos/:idinsumo', checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)},function (req, res) {
    var idInsumo = req.params.idinsumo;
      connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias  WHERE i.activo=1 && i.id = ?", [idInsumo], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })
  });


  app.get('/list-insumos-sin-cantidad',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)}, function (req, res) {

      connection.query("SELECT i.id, i.descripcion, i.activo, i.unidad, i.minimo, ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE activo=1", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })


  });

  app.get('/list-insumos',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)}, function (req, res) {
      connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.activo=1", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });

        res.json({ success: 1, result });
      })
  });

	app.get('/list-insumos-movimientos', checkConnection, function (req, res) {

    connection.query("CALL insumos_listar_movimientos()", function (err, result) {
      if (err) return res.state(500).send("error de consulta SQL");
      res.json({ success: 1, result:result[0] });
    })

  });

  app.get('/list-insumos-alertados',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)}, function (req, res) {
    connection.query("call insumos_listar_alertados()", function (err, result) {


      //connection.query("call update_insumos_costo(?)", [[req.body.costo, new Date(), id_insumo, userId]], function (err, result) {

    // connection.query("SELECT i.id_insumos_categorias, i.numero, i.descripcion, i.activo, i.unidad, i.minimo, i.cantidad, i.costo, i.fecha_actualizacion_costo, i.alertar, i.autorizar, ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.activo=1 and i.alertar = 1 and i.fecha_actualizacion_costo <= DATE_SUB(NOW(), INTERVAL 30 DAY)", function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })
});


  app.get('/select-insumos/:id', checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)},function (req, res) {

      connection.query("SELECT i.*,ic.codigo FROM insumos i LEFT JOIN insumos_categorias ic ON ic.id = i.id_insumos_categorias WHERE i.id=?", [req.params.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })


  });


  app.post('/delete-insumos', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[22],connection)}, function (req, res) {

      connection.query("UPDATE insumos set activo = 0 where id = ?", [req.body.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })

  });


  app.post('/insert-categorias', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[21],connection)}, function (req, res) {

    var arrayIns = [req.body.codigo, req.body.descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
      res.json({ success: 1, result });
    })

});

  app.post('/insert-insumos', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[22],connection)}, function (req, res) {
		var idUser = null;
		if(req.user)
			idUser = req.user.id;

      var arrayIns = [req.body.categoria,req.body.numero, req.body.descripcion, req.body.unidad, req.body.minimo,req.body.alertar, req.body.autorizar,idUser];

      connection.query("SELECT * FROM insumos WHERE id_insumos_categorias = ? AND numero = ?", [req.body.categoria, req.body.numero], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al chequear duplicidad de insumos", err });
        else{
          if(result.length > 1) {
            return res.json({ success: 0, error_msj: "No se puede guardar, código ya utilizado. Ingrese otro.", err });
          }
          else {
            connection.query("CALL insumos_crear(?)", [arrayIns], function (err, result) {

              if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
              res.json({ success: 1, result });
            })
         }

        }

      })



  });


  app.post('/update-insumos-costos', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[23],connection)}, function (req, res) {
    var userId = null;
    if(req.user)
    userId = req.user.id;

    if (req.body.id) {
      var id_insumo = parseInt(req.body.id);
     // var objectoUpdate = {costo: req.body.costo, fecha_actualizacion_costo: new Date()};
     // connection.query("UPDATE insumos SET ? where id = ?", [objectoUpdate, id_insumo], function (err, result) {
      connection.query("call update_insumos_costo(?)", [[req.body.costo, new Date(), id_insumo, userId]], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar el costo del insumo", err });
        else{
        res.json({ success: 1, result });
      }
      });
    } else {
      res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })
    }
});


  app.post('/update-insumos', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[22],connection)}, function (req, res) {
			var userId = null;
			if(req.user)
			userId = req.user.id;

      if (req.body.id) {
        var id_insumo = parseInt(req.body.id);
        var arrayUpdate = [req.body.categoria,req.body.numero,req.body.id,req.body.minimo,req.body.descripcion,req.body.unidad, req.body.alertar, req.body.autorizar, userId];
        connection.query("CALL insumos_modificar(?)", [arrayUpdate], function (err, result) {
          if (err){
						console.log(err.sqlMessage);
						if(err.sqlMessage)
						return res.status(500).send(err.sqlMessage)
						else
						return res.status(500).send("ha ocurrido un error al intentar actualizar insumo");

					}

					res.json({ success: 1, result });


        });
      } else {
        res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })

      }

  });


  app.get('/get-siguiente/:idcategoria',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)}, function (req, res) {
    var idCategoria = parseInt(req.params.idcategoria);
    connection.query("select max(numero) + 1 as siguiente FROM insumos where id_insumos_categorias = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })
  });



  app.post('/insert-categorias', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[21],connection)}, function (req, res) {

    var arrayIns = [req.body.codigo, req.body.descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
      res.json({ success: 1, result });
    })

});

app.get('/list-categorias',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)} , function (req, res) {
  connection.query("SELECT * FROM insumos_categorias WHERE activo=1", function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.post('/delete-categorias', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[21],connection)}, function (req, res) {
  connection.query("UPDATE insumos_categorias set activo = 0 where id = ?", [req.body.id], function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.get('/list-categorias/:idcategoria', checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[],connection)},function (req, res) {
  var idCategoria = req.params.idcategoria;
    connection.query("SELECT * FROM insumos_categorias WHERE activo=1 && id = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ suidcategoriaccess: 0, error_msj: err });
      res.json({ success: 1, result });
    })
});

app.post('/update-categorias', bodyJson,checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[21],connection)}, function (req, res) {

  if (req.body.id) {
    var id_insumo = parseInt(req.body.id);
    var objectoUpdate = { codigo: req.body.codigo, descripcion: req.body.descripcion };
    connection.query("UPDATE insumos_categorias SET ? where id = ?", [objectoUpdate, id_insumo], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar insumo", err });
      res.json({ success: 1, result });
    });
  } else {
    res.json({ success: 0, error_msj: "el id de la tabla insumos_categorias no esta ingresado" })

  }

});



  function checkConnection(req,res,next) {
    console.log(connection.state);
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }




}
