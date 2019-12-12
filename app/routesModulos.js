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

  app.get('/list-modulos',checkConnection, function (req, res) {

    try {
      connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 ORDER BY m.id DESC", function (err, result) {
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


  app.post('/delete-modulo', bodyJson,checkConnection, function (req, res) {
		let idUser = null;
		if(req.user)
			idUser = req.user.id;
    try {
      connection.query("CALL modulos_eliminar(?,?,?)", [req.body.id,idUser,req.body.motivo], function (err, result) {
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


	app.post('/insert-modulo', bodyJson, checkConnection, function (req, res) {
		var idUser=null;
		if(req.user)
			idUser = req.user.id;

		connection.getConnection(function(err, connection) {
			if (err) {
				connection.release();
				  res.json({ success: 5,err }); }

		connection.beginTransaction(function (err) {
			if (err) {
				connection.release();
				  res.json({ success: 5,err }); }
			var datenow = new Date();
			//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
			var arrayIns = [req.body.chasis, req.body.descripcion,'Cliente',idUser];
			connection.query("CALL modulos_crear (?)", [arrayIns], function (err, result) {
				if (err) {
					return connection.rollback(function () {
						connection.release();
					  res.json({ success: 5,err });
					});
				}
			
				var insertedId = result[0][0].id;
				var values = [];
				req.body.detalle.forEach(element => {
					values.push([element.cantidad,insertedId, element.id,idUser]);
				});
			recorrerArrayAgregar(values,0,connection,res,function(){

					connection.commit(function (err) {
						if (err) {
							return connection.rollback(function () {
								connection.release();
								  res.json({ success: 5,err });
							});
						} else {
							connection.release();
							  res.json({ success: 1 });
					}
					});
				});
			});

		});

	})

	});

	 function recorrerArrayAgregar(array, index,connection,res, callback) {

    if (array.length > 0) {
      let sql = "CALL modulos_agregar_insumo(?)";
     
      connection.query(sql, [array[index]], function (err, results) {

        if (error) {
          return connection.rollback(function () {
						connection.release();
            res.json({ success: 5,err });
          });
        }

        if (array.length > index + 1) {
          recorrerArrayAgregar(array, index + 1,connection,res, callback)
        }
        else {
          callback();
        }

      })
    } else {
      callback();
    }

  }


	app.post('/update-modulo', bodyJson, checkConnection, function (req, res) {
		var idUser=null;
		if(req.user)
			idUser = req.user.id;

		connection.getConnection(function(err, connection) {
			if (err) {
				connection.release();
				  res.json({ success: 5,err }); }

		connection.beginTransaction(function (err) {
			if (err) {
				connection.release();
				  res.json({ success: 5,err }); }
			
			//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
			var arrayMod = [req.body.chasis, req.body.descripcion,'Cliente','Motivo1',req.body.id,idUser];
			connection.query("CALL modulos_modificar (?)", [arrayMod], function (err, result) {
				if (err) {
					return connection.rollback(function () {
						connection.release();
					  res.json({ success: 5,err });
					});
				}
			
			recorrerArrayModificar(req.body.detalle,req.body.id,idUser,0,connection,res,function(){

					connection.commit(function (err) {
						if (err) {
							return connection.rollback(function () {
								connection.release();
								  res.json({ success: 5,err });
							});
						} else {
							connection.release();
							  res.json({ success: 1 });
					}
					});
				});
			});

		});

	})

	});


	 function recorrerArrayModificar(array,id,idUser, index,connection,res, callback) {

    if (array.length > 0) {

      let sql;
			let objeto = array[index];
			let arrayMod;
			if(objeto.insertado){
				sql = "CALL modulos_agregar_insumo(?)";
				arrayMod = [objeto.cantidad,id,objeto.id,idUser];

			} else if(objeto.modificado) {
					sql = "CALL modulos_modificar_cantidad_insumo(?)";
					arrayMod = [objeto.cantidad,objeto.id_modulos_insumos,idUser];

			} else if(objeto.eliminado) {
				sql = "CALL modulos_eliminar_insumo(?)";
					arrayMod = [objeto.id_modulos_insumos,idUser];

			}
     
      connection.query(sql, [arrayMod], function (err, results) {

        if (err) {
          return connection.rollback(function () {
						connection.release();
            res.json({ success: 5,err });
          });
        }

        if (array.length > index + 1) {
          recorrerArrayModificar(array,id,idUser, index + 1,connection,res, callback)
        }
        else {
          callback();
        }

      })
    } else {
      callback();
    }

  }




	app.get('/list-modulos-insumos/:idModulo', checkConnection, function (req, res) {
		var idModulo = req.params.idModulo;

		connection.query("SELECT * FROM modulos m  WHERE m.activo = 1 AND m.id = ? ", [idModulo], function (err, resultModulo) {
			if (err) return res.json({ success: 0, error_msj: err });

			connection.query("SELECT i.*,mi.cantidad,mi.id as id_modulos_insumos,ic.codigo FROM modulos_insumos mi LEFT JOIN insumos i ON i.id = mi.id_insumo LEFT JOIN insumos_categorias ic ON i.id_insumos_categorias = ic.id  WHERE mi.activo = 1 AND mi.id_modulo = ? ", [idModulo], function (err, resultInsumos) {
				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, modulo: resultModulo, insumos: resultInsumos });

			})


		})


	});



  function checkConnection(req,res,next) {
    console.log(connection.state);
    // connection = mysql.createConnection(dbconfig.connection);



    next();

  }


}
