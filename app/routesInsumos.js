var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app,connection, passport) {

  app.get('/list-insumos/:idinsumo', checkConnection,function (req, res) {
    var idInsumo = req.params.idinsumo;
      connection.query("SELECT * FROM insumos WHERE activo=1 && id = ?", [idInsumo], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })
  });


  app.get('/list-insumos-sin-cantidad',checkConnection, function (req, res) {

      connection.query("SELECT id, codigo, descripcion, activo, unidad, minimo FROM insumos WHERE activo=1", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });

      })


  });

  app.get('/list-insumos',checkConnection, function (req, res) {
      connection.query("SELECT * FROM insumos WHERE activo=1", function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })
  });

  app.get('/select-insumos/:id', checkConnection,function (req, res) {

      connection.query("SELECT * FROM insumos WHERE id=?", [req.params.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })


  });


  app.post('/delete-insumos', bodyJson,checkConnection, function (req, res) {

      connection.query("UPDATE insumos set activo = 0 where id = ?", [req.body.id], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: err });
        res.json({ success: 1, result });
      })

  });


  app.post('/insert-categorias', bodyJson,checkConnection, function (req, res) {

    var arrayIns = [req.body.codigo, req.body.descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
      res.json({ success: 1, result });
    })

});

  app.post('/insert-insumos', bodyJson,checkConnection, function (req, res) {

      var arrayIns = [req.body.codigo, req.body.descripcion, req.body.unidad, req.body.minimo, 1, req.body.categoria, req.body.numero];

      connection.query("SELECT * FROM insumos WHERE id_insumos_categorias = ? AND numero = ?", [req.body.categoria, req.body.numero], function (err, result) {
        if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al chequear duplicidad de insumos", err });
        else{
          if(result.length > 1) {
            return res.json({ success: 0, error_msj: "No se puede guardar, código ya utilizado. Ingrese otro.", err });
          }
          else {
            connection.query("INSERT INTO insumos (codigo, descripcion, unidad, minimo, activo, id_insumos_categorias, numero) VALUES (?)", [arrayIns], function (err, result) {
              if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
              res.json({ success: 1, result });
            })
         }

        }

      })



  });


  app.post('/update-insumos', bodyJson,checkConnection, function (req, res) {
			var userId = null;
			if(req.user)
			userId = req.user.id;

      if (req.body.id) {
        var id_insumo = parseInt(req.body.id);
        var objectoUpdate = { codigo: req.body.codigo, descripcion: req.body.descripcion, unidad: req.body.unidad, id_insumos_categorias: req.body.categoria, numero: req.body.numero };
        connection.query("UPDATE insumos SET ? where id = ?", [objectoUpdate, id_insumo], function (err, result) {
          if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar insumo", err });
					if(req.body.minimo){
						var arrayUpdate =[5,userId, new Date(),id_insumo,req.body.minimo];
					connection.query("INSERT INTO auditoria_stock (id_movimiento,id_user,fecha,id_insumo,minimo) VALUES (?)", [arrayUpdate], function (err, result) {
						if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar auditoria stock", err });
						res.json({ success: 1, result });
					})
				}else{
					res.json({ success: 1, result });
				}

        });
      } else {
        res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })

      }

  });


  app.get('/get-siguiente/:idcategoria',checkConnection, function (req, res) {
    var idCategoria = req.params.idcategoria;
    connection.query("select max(numero)+1 as siguiente FROM boxrental.insumos where id_insumos_categorias = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ success: 0, error_msj: err });
      res.json({ success: 1, result });
    })
  });



  app.post('/insert-categorias', bodyJson,checkConnection, function (req, res) {

    var arrayIns = [req.body.codigo, req.body.descripcion];
    connection.query("INSERT INTO insumos_categorias (codigo, descripcion) VALUES (?)", [arrayIns], function (err, result) {

      if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
      res.json({ success: 1, result });
    })

});

app.get('/list-categorias',checkConnection, function (req, res) {
  connection.query("SELECT * FROM insumos_categorias WHERE activo=1", function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.post('/delete-categorias', bodyJson,checkConnection, function (req, res) {
  connection.query("UPDATE insumos_categorias set activo = 0 where id = ?", [req.body.id], function (err, result) {
    if (err) return res.json({ success: 0, error_msj: err });
    res.json({ success: 1, result });
  })
});

app.get('/list-categorias/:idcategoria', checkConnection,function (req, res) {
  var idCategoria = req.params.idcategoria;
    connection.query("SELECT * FROM insumos_categorias WHERE activo=1 && id = ?", [idCategoria], function (err, result) {
      if (err) return res.json({ suidcategoriaccess: 0, error_msj: err });
      res.json({ success: 1, result });
    })
});

app.post('/update-categorias', bodyJson,checkConnection, function (req, res) {

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

     connection = mysql.createConnection(dbconfig.connection);



    next();

  }



}
