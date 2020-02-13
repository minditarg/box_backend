var mysql = require('mysql');
var general = require('./functionsGeneral');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json();
var bcrypt = require('bcrypt-nodejs');


module.exports = function (app,connection, passport) {


	app.get('/me',checkConnection,(req,res,next) => { general.checkPermission(req,res,next,[])}, function (req, res) {
		var userId = req.user.id;

		connection.query("CALL get_user(?)",[userId], function (err, result) {
				if (err) {
					return res.json({ success: 0, error_msj: err });
				}


					res.json({ success: 1,result });

		})




	});

  app.get('/list-users_type', checkConnection,function (req, res) {


			connection.query("SELECT * FROM users_type WHERE activo = 1", function (err, result) {
				if (err) {
					return res.json({ success: 0, error_msj: err });
				}
				else {

					res.json({ success: 1, result });
				}

			})





	});



	app.post('/login-json', bodyJson,checkConnection, function (req, res) {


			passport.authenticate('local-login', function (err, user, info) {
				if (err) { return res.json({ success: 0, error_msj: "no se pudo autenticar" }, err) }
				if (!user) { return res.json({ success: 0, error_msj: "el usuario o contraseña son incorrectos" }) }
				req.logIn(user, function (err) {
					if (err) { return res.json({ success: 0, error_msj: "no se pudo loguear" }, err) }
					if (req.body.remember) {
						req.session.cookie.maxAge = 1000 * 60 * 3;
					} else {
						req.session.cookie.expires = false;
					}
					return res.json({ success: 1, user });
				});
			})(req, res);

	});


	app.post('/signup-json', bodyJson, checkConnection,function (req, res) {

			passport.authenticate('local-signup', function (err, user, info) {
				if (err) { return res.json({ success: 0, error_msj: "no se pudo autenticar" }, err) }
				if (!user) { return res.json({ success: 0, error_msj: "Posible nombre de usuario duplicado" }) }

				return res.json({ success: 1, user });

			})(req, res);


	});


	app.get('/list-users/:idUser',checkConnection, function (req, res) {

			var idUser = req.params.idUser;
			connection.query("SELECT * FROM users u LEFT JOIN users_type as ut ON u.id_users_type = ut.id WHERE u.id = ?", [idUser], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, result });
			});


	});

	app.get('/list-users',isLoggedIn, checkConnection,function (req, res) {
		var userMeId = 0;
			if(req.user){
					userMeId = req.user.id;
			}
			connection.query("SELECT ut.descripcion as descripcion_users_type,ut.id as id_user_type,u.id,u.username,u.nombre FROM users u LEFT JOIN (SELECT * FROM users_type WHERE activo = 1) as ut ON u.id_users_type = ut.id WHERE u.id != ? AND u.activo = 1 ",[userMeId], function (err, result) {

				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, result });
			});



	});


	app.get('/list-tipos-usuarios',isLoggedIn, checkConnection,function (req, res) {
		var userMeId = 0;
			if(req.user){
					userMeId = req.user.id;
			}
			connection.query("CALL users_listar_tipos_usuarios()", function (err, result) {

				if (err) return res.status(500).send("error de consulta SQL");
				res.json({ success: 1, result: result[0] });
			});



	});


	app.get('/list-tipo-usuario/:idTipoUsuario',isLoggedIn, checkConnection,function (req, res) {
		let idTipoUsuario = req.params.idTipoUsuario;
			connection.query("CALL users_detalle_tipo_usuario(?)",[ idTipoUsuario ], function (err, result) {

				if (err) return res.status(500).send("error de consulta SQL");
				res.json({ success: 1, tipoUsuario: result[0],detalleAccesos: result[1],accesos: result[2] });
			});



	});

	app.get('/list-accesos',isLoggedIn, checkConnection,function (req, res) {
		let idTipoUsuario = req.params.idTipoUsuario;
			connection.query("SELECT * FROM accesos", function (err, result) {

				if (err) return res.status(500).send("error de consulta SQL");
				res.json({ success: 1, result });
			});



	});


	app.post('/insert-tipo-usuario',isLoggedIn,bodyJson, checkConnection,function (req, res) {


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

	      connection.query("CALL users_insertar_tipos_usuarios(?)", [req.body.descripcion], function (error, result) {
	        if (error) {
	          return connection.rollback(function () {
	            connection.release();
	            throw error;
	          });
	        }
				let resultado =	JSON.parse(JSON.stringify(result[0]))
					let insertedId = parseInt(resultado[0].inserted_id);


	          var sql = "INSERT INTO users_type_accesos (id_user_type,id_acceso) VALUES ?";
	          var values = [];
	          req.body.accesos.forEach(element => {
							if(element.checked)
	            values.push([insertedId,element.id]);
	          });

						if(values.length <= 0)
							sql = "SELECT @no_data_accesos";



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
	  })



	});

	app.post('/update-tipo-usuario', bodyJson, checkConnection, function (req, res) {

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
        descripcion: req.body.descripcion
      }
      connection.query("UPDATE users_type SET ? WHERE id = ?", [updObj, req.body.id], function (error, result) {
        if (error) {
          return connection.rollback(function () {
            connection.release();
            throw error;
          });
        }

        connection.query("DELETE FROM users_type_accesos WHERE id_user_type = ?", req.body.id, function (error, result) {
          if (error) {
            return connection.rollback(function () {
              connection.release();
              throw error;
            });
          }

          var sql = "INSERT INTO users_type_accesos (id_user_type,id_acceso) VALUES ?";
          var values = [];
          req.body.accesos.forEach(element => {
						if(element.checked)
            values.push([element.id_users_type,element.id]);
          });


					if(values.length <= 0)
						sql = "SELECT @no_data_accesos";



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



	app.post('/update-user',isLoggedIn, bodyJson,checkConnection, function (req, res) {


			if (req.body.id) {
				var id_users = parseInt(req.body.id);
				var objectoUpdate = { nombre: req.body.nombre, id_users_type: req.body.id_users_type };
				connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id_users], function (err, result) {
					if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar users", err });
					res.json({ success: 1, result });
				});

			} else {
				res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

			}

	});


	app.post('/update-pass',isLoggedIn, bodyJson,checkConnection, function (req, res) {

		if (req.body.id) {
			var id_users = parseInt(req.body.id);
			var objectoUpdate = { password:bcrypt.hashSync(req.body.newpass, null, null) };
			connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id_users], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar users", err });
				res.json({ success: 1, result });
			});

		} else {
			res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

		}

});

	app.post('/delete-user', bodyJson,checkConnection, function (req, res) {


			if (req.body.id) {
				var id_users = parseInt(req.body.id);
				var objectoUpdate = { activo: 0 };
				connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id_users], function (err, result) {
					if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar users", err });
					res.json({ success: 1, result });
				});

			} else {
				res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

			}

	});


	app.post('/delete-tipo-usuario', bodyJson,checkConnection, function (req, res) {

			if (req.body.id) {
				var id_users = parseInt(req.body.id);
				var objectoUpdate = { activo: 0 };
				connection.query("UPDATE users_type SET ? where id = ?", [objectoUpdate, id_users], function (err, result) {
					if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar users", err });
					res.json({ success: 1, result });
				});

			} else {
				res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

			}

	});


  app.get('/logout', function (req, res) {
		req.logout();
		res.json({ success: 1, msj:"el usuario se ha cerrado sesión correctamente" });
	});

  function checkConnection(req,res,next) {
	  console.log(connection.state);
     //connection = mysql.createConnection(dbconfig.connection);


    next();

  }

	function isLoggedIn(req, res, next) {
		// if user is authenticated in the session, carry on
		if (req.isAuthenticated())
			return next();
		// if they aren't redirect them to the home page
		res.json({ success: 3, error_msj: "no esta autenticado" });
	}

}
