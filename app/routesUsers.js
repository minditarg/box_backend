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


module.exports = function (app, connection, passport) {


	app.get('/me', (req, res, next) => { general.checkPermission(req, res, next, [], connection) }, function (req, res) {
		var userId = req.user.id || null;

		connection.query("CALL get_user(?)", [userId], function (err, result) {
			if (err) return res.status(500).send(err);


			res.json({ success: 1, result });

		})


	});

	app.get('/list-users_type', isLoggedIn, function (req, res) {

		connection.query("SELECT * FROM users_type WHERE activo = 1", function (err, result) {
			if (err) return res.status(500).send(err);

			res.json({ success: 1, result });

		})

	});



	app.post('/login-json', bodyJson, function (req, res) {
		req.body.username = req.body.username || null;
		req.body.password = req.body.password || null;

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


	app.post('/signup-json', bodyJson, function (req, res) {
		req.body.username = req.body.username || null;
		req.body.password = req.body.password || null;
		req.body.nombre = req.body.nombre || null;
		req.body.id_users_type = parseInt(req.body.id_users_type) || null;

		passport.authenticate('local-signup', function (err, user, info) {
			if (err) { return res.json({ success: 0, error_msj: "no se pudo autenticar" }, err) }
			if (!user) { return res.json({ success: 0, error_msj: "Posible nombre de usuario duplicado" }) }

			return res.json({ success: 1, user });

		})(req, res);


	});


	app.get('/list-users/:idUser', function (req, res) {

		var idUser = req.params.idUser;
		connection.query("SELECT * FROM users u LEFT JOIN users_type as ut ON u.id_users_type = ut.id WHERE u.id = ?", [idUser], function (err, result) {
			if (err) return res.status(500).send(err);
			res.json({ success: 1, result });
		});


	});

	app.get('/list-users', isLoggedIn, function (req, res) {
		userMeId = (req.user && req.user.id) || null;
		connection.query("SELECT ut.descripcion as descripcion_users_type,ut.id as id_user_type,u.id,u.username,u.nombre FROM users u LEFT JOIN (SELECT * FROM users_type WHERE activo = 1) as ut ON u.id_users_type = ut.id WHERE u.id != ? AND u.activo = 1 ", [userMeId], function (err, result) {

			if (err) return res.status(500).send(err);
			res.json({ success: 1, result });
		});



	});


	app.get('/list-tipos-usuarios', isLoggedIn, function (req, res) {

		connection.query("CALL users_listar_tipos_usuarios()", function (err, result) {

			if (err) return res.status(500).send(err);
			res.json({ success: 1, result: result[0] });
		});



	});


	app.get('/list-tipo-usuario/:idTipoUsuario', isLoggedIn, function (req, res) {
		let idTipoUsuario = parseInt(req.params.idTipoUsuario) || null;
		connection.query("CALL users_detalle_tipo_usuario(?)", [idTipoUsuario], function (err, result) {

			if (err) return res.status(500).send(err);
			res.json({ success: 1, tipoUsuario: result[0], detalleAccesos: result[1], accesos: result[2] });
		});



	});

	app.get('/list-accesos', isLoggedIn, function (req, res) {
		connection.query("SELECT * FROM accesos", function (err, result) {

			if (err) return res.status(500).send(err);
			res.json({ success: 1, result });
		});



	});


	app.post('/insert-tipo-usuario', (req, res, next) => { general.checkPermission(req, res, next, [12], connection) }, bodyJson, function (req, res) {
		let descripcion = req.body.descripcion || null;
		let accesos = (Array.isArray(req.body.accesos) && req.body.accesos) || [];



		connection.getConnection(function (err, connection) {
			if (err) {
				connection.release();
				throw err;
			}

			connection.beginTransaction(function (err) {


				if (err) {
					connection.release();
					res.status(500).send(err);
				}
				var datenow = new Date();
				//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
				//var arrayIns = [req.body.codigo, req.body.descripcion, 1];

				connection.query("CALL users_insertar_tipos_usuarios(?)", [descripcion], function (err, result) {
					if (err) {
						return connection.rollback(function () {
							connection.release();
							res.status(500).send(err);
						});
					}
					let resultado = JSON.parse(JSON.stringify(result[0]))
					let insertedId = parseInt(resultado[0].inserted_id);


					var sql = "INSERT INTO users_type_accesos (id_user_type,id_acceso) VALUES ?";
					var values = [];
					accesos.forEach(element => {
						if (element.checked)
							values.push([insertedId, element.id]);
					});

					if (values.length <= 0)
						sql = "SELECT @no_data_accesos";



					connection.query(sql, [values], function (err, results) {

						if (err) {
							return connection.rollback(function () {
								connection.release();
								res.status(500).send(err);
							});
						}

						connection.commit(function (err) {
							if (err) {
								return connection.rollback(function () {
									connection.release();
									res.status(500).send(err);
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

	app.post('/update-tipo-usuario', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [12], connection) }, function (req, res) {
		let id = parseInt(req.body.id) || null;
		let descripcion = req.body.descripcion || null;
		let accesos = (Array.isArray(req.body.accesos) && req.body.accesos) || [];


		connection.getConnection(function (err, connection) {
			if (err) {
				connection.release();
				throw err;
			}

			connection.beginTransaction(function (err) {
				if (err) {
					connection.release();
					res.status(500).send(err);
				}
				var datenow = new Date();
				//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
				//var arrayIns = [req.body.codigo, req.body.descripcion, 1];
				var updObj = {
					descripcion: descripcion
				}
				connection.query("UPDATE users_type SET ? WHERE id = ?", [updObj, id], function (err, result) {
					if (err) {
						return connection.rollback(function () {
							connection.release();
							res.status(500).send(err);
						});
					}

					connection.query("DELETE FROM users_type_accesos WHERE id_user_type = ?", id, function (err, result) {
						if (err) {
							return connection.rollback(function () {
								connection.release();
								res.status(500).send(err);
							});
						}

						var sql = "INSERT INTO users_type_accesos (id_user_type,id_acceso) VALUES ?";
						var values = [];
						accesos.forEach(element => {
							if (element.checked)
								values.push([element.id_users_type, element.id]);
						});


						if (values.length <= 0)
							sql = "SELECT @no_data_accesos";



						connection.query(sql, [values], function (err, results) {

							if (err) {
								return connection.rollback(function () {
									connection.release();
									res.status(500).send(err);
								});
							}

							connection.commit(function (err) {
								if (err) {
									return connection.rollback(function () {
										connection.release();
										res.status(500).send(err);
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



	app.post('/update-user', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [11], connection) }, function (req, res) {
		let id = parseInt(req.body.id) || null;
		let nombre = req.body.nombre || null;
		let id_users_type = parseInt(req.body.id_users_type) || null;

		if (id) {
			var objectoUpdate = { nombre: nombre, id_users_type: id_users_type };
			connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id], function (err, result) {
				if (err) return res.status(500).send(err);
				res.json({ success: 1, result });
			});

		} else {

			return res.status(500).send("el id de la tabla users no esta ingresado");

		}

	});


	app.post('/update-pass', (req, res, next) => { general.checkPermission(req, res, next, [11], connection) }, bodyJson, function (req, res) {
		let id = parseInt(req.body.id) || null;
		let newpass = req.body.newpass || null;

		if (id) {
			var objectoUpdate = { password: bcrypt.hashSync(newpass, null, null) };
			connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id], function (err, result) {
				if (err) return res.status(500).send(err);
				res.json({ success: 1, result });
			});

		} else {
			return res.status(500).send("el id de la tabla users no esta ingresado");

		}

	});

	app.post('/delete-user', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [11], connection) }, function (req, res) {
		let id = parseInt(req.body.id) || null;

		if (id) {
			var objectoUpdate = { activo: 0 };
			connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id], function (err, result) {
				if (err) return res.status(500).send(err);
				res.json({ success: 1, result });
			});

		} else {
			res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

		}

	});


	app.post('/delete-tipo-usuario', bodyJson, (req, res, next) => { general.checkPermission(req, res, next, [12], connection) }, function (req, res) {
		let id = parseInt(req.body.id) || null;

		if (id) {

			var objectoUpdate = { activo: 0 };
			connection.query("UPDATE users_type SET ? where id = ?", [objectoUpdate, id], function (err, result) {
				if (err) return res.status(500).send(err);
				res.json({ success: 1, result });
			});

		} else {
			res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

		}

	});


	app.get('/logout', function (req, res) {
		req.logout();
		res.json({ success: 1, msj: "el usuario se ha cerrado sesión correctamente" });
	});

	function checkConnection(req, res, next) {
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
