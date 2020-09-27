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

	app.get('/list-modulos', checkConnection, function (req, res) {

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

	app.get('/list-modulos-movimientos', checkConnection, function (req, res) {

		connection.query("CALL modulos_listar_movimientos()", function (err, result) {
			if (err) return res.status(500).send("error de consulta SQL");
			res.json({ success: 1, result: result[0] });
		})

	});


	app.get('/list-modulos-movimientos-insumos/:idModuloMovimiento', checkConnection, function (req, res) {
		let idModuloMovimiento = parseInt(req.params.idModuloMovimiento);

		connection.query("CALL modulos_listar_movimientos_insumos(?)", [idModuloMovimiento], function (err, result) {
			if (err) return res.status(500).send(err.sqlMessage);
			res.json({ success: 1, result: result[0] });
		})

	});

	app.get('/list-modulos-diseno', checkConnection, function (req, res) {

		try {
			connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 AND m.id_modulo_estado = 1 ORDER BY m.id DESC", function (err, result) {
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


	app.get('/list-modulos-finalizados', checkConnection, function (req, res) {

		try {
			connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 AND m.id_modulo_estado = 5 ORDER BY m.id DESC", function (err, result) {
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



	app.get('/list-modulos-cancelados', checkConnection, function (req, res) {

		try {
			connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 AND m.id_modulo_estado = 4 ORDER BY m.id DESC", function (err, result) {
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

	app.get('/list-modulos-produccion', checkConnection, function (req, res) {

		try {
			connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 AND m.id_modulo_estado = 2 ORDER BY m.id DESC", function (err, result) {
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

	app.get('/list-modulos-pausados', checkConnection, function (req, res) {

		try {
			connection.query("SELECT m.*, e.descripcion as descripcion_estado FROM modulos m inner join modulos_estados e on m.id_modulo_estado = e.id WHERE m.activo = 1 AND m.id_modulo_estado = 3 ORDER BY m.id DESC", function (err, result) {
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



	app.post('/disenoaproducir-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		let chasis = null;
		if (req.user)
			idUser = req.user.id;

		if (req.body.chasis.trim())
			chasis = req.body.chasis.trim();
		else
			return res.status(500).send("Debe ingresar un numero de chasis valido");

		try {
			connection.query("call modulo_diseno_a_produccion(?) ", [[req.body.id, chasis]], function (err, result) {
				if (err) return res.status(500).send(err.sqlMessage);
				res.json({ success: 1, result });
			})
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}
	});

	app.post('/producir-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		if (req.user)
			idUser = req.user.id;
		try {
			connection.query("UPDATE modulos SET id_modulo_estado = 2 WHERE id = ?", [req.body.id], function (err, result) {
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



	app.post('/cancelar-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		if (req.user)
			idUser = req.user.id;
		try {
			connection.query("UPDATE modulos SET id_modulo_estado = 4 WHERE id = ?", [req.body.id], function (err, result) {
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


	app.post('/pausar-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		if (req.user)
			idUser = req.user.id;
		try {
			connection.query("UPDATE modulos SET id_modulo_estado = 3 WHERE id = ?", [req.body.id], function (err, result) {
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

	app.post('/finalizar-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		if (req.user)
			idUser = req.user.id;
		try {
			connection.query("CALL modulos_finalizar(?,?)", [req.body.id, idUser], function (err, result) {
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

	app.get('/list-modulos-paniol', checkConnection, function (req, res) {
		let cantidad = req.params.cantidad;
		connection.query("CALL modulos_listar_paniol()", function (err, result) {
			if (err) return res.json({ success: 0, error_msj: err });

			res.json({ success: 1, modulos: result[0], insumosDisponibles: result[1] });

		})


	});


	app.get('/modulos-montos/:idModulo', bodyJson, checkConnection, function (req, res) {
		let idModulo = req.params.idModulo;
		try {
			connection.query("CALL modulos_montos(?)", [idModulo], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, modulos: result[0] });
			})
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}

	});



	app.get('/modulos-analizar-insumos/:idModulo', bodyJson, checkConnection, function (req, res) {
		let idModulo = req.params.idModulo;
		try {
			connection.query("CALL modulos_analizar_insumos(?)", [idModulo], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, modulo: result[0], insumos: result[1] });
			})
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}

	});



	app.post('/delete-modulo', bodyJson, checkConnection, function (req, res) {
		let idUser = null;
		if (req.user)
			idUser = req.user.id;
		try {
			connection.query("CALL modulos_eliminar(?,?,?)", [req.body.id, idUser, req.body.motivo], function (err, result) {
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

	app.post('/ordenar-modulos', bodyJson, checkConnection, function (req, res) {
		let values = [];
		req.body.detalle.forEach((element, index) => {
			if (element.id_modulo_insumo)
				values.push([element.id_modulo_insumo, index]);
		});
		recorrerArrayOrdenar(values, 0, connection, res, function () {

			res.json({ success: 1 });

		})




	});

	function recorrerArrayOrdenar(array, index, connection, res, callback) {

		if (array.length > 0) {
			let sql = "CALL modulos_ordenar_insumo(?)";

			connection.query(sql, [array[index]], function (err, results) {
				console.log("hola matias");
				if (err) {
					console.log(err);
					return res.json({ success: 0, err });

				}

				if (array.length > index + 1) {
					recorrerArrayOrdenar(array, index + 1, connection, res, callback)
				}
				else {
					callback();
				}

			})
		} else {
			callback();
		}

	}


	app.get('/list-modulos-plantillas/:idModulo', checkConnection, function (req, res) {
		let idModulo = parseInt(req.params.idModulo);

		connection.query("CALL modulos_listar_plantillas(?)", [idModulo], function (err, result) {
			if (err) return res.status(500).send(err.sqlMessage);
			res.json({ success: 1, result: result[0] });
		})

	});


	app.post('/insert-modulo', bodyJson, checkConnection, function (req, res) {
		var idUser = null;
		if (req.user)
			idUser = req.user.id;
		/*
		connection.getConnection(function (err, connection) {
			if (err) {
				connection.release();
				res.json({ success: 0, err });
			}
			*/
		connection.beginTransaction(function (err) {
			if (err) {
				//	connection.release();
				res.json({ success: 0, err });
			}
			var datenow = new Date();
			//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
			var arrayIns = [req.body.chasis, req.body.cotizacion, req.body.descripcion, 'Cliente', idUser];
			connection.query("CALL modulos_crear (?)", [arrayIns], function (err, result) {
				if (err) {
					return connection.rollback(function () {
						//	connection.release();
						res.json({ success: 0, err });
					});
				}

				var insertedId = result[0][0].id;
				var insertedIdMovimiento = result[0][0].id_modulo_movimiento;
				var values = [];
				var cantidad_requerida = 0;
				req.body.detalle.forEach((element, index) => {
					values.push([element.cantidad_requerida, insertedId, insertedIdMovimiento, element.id, index, idUser]);
				});


				connection.query("DELETE FROM modulos_plantillas WHERE id_modulo = ?", insertedId, function (err, result) {
					if (err) {
						return connection.rollback(function () {
							//	connection.release();
							res.json({ success: 0, err });
						});
					}


					if (req.body.plantillas.length > 0) {
						plantillasAsociadas = [];
						req.body.plantillas.forEach((element, index) => {
							plantillasAsociadas.push([insertedId, element.id]);
						});


						connection.query("INSERT into modulos_plantillas (id_modulo, id_plantilla) values ?", [plantillasAsociadas], function (err, result) {
							if (err) {
								return connection.rollback(function () {
									//	connection.release();
									res.json({ success: 0, err });
								});
							}

							recorrerArrayAgregar(values, 0, connection, res, function () {

								connection.commit(function (err) {
									if (err) {
										return connection.rollback(function () {
											//	connection.release();
											res.json({ success: 0, err });
										});
									} else {
										//connection.release();
										res.json({ success: 1 });
									}
								});
							});
						});
					}
					else {
						recorrerArrayAgregar(values, 0, connection, res, function () {

							connection.commit(function (err) {
								if (err) {
									return connection.rollback(function () {
										//	connection.release();
										res.json({ success: 0, err });
									});
								} else {
									connection.release();
									res.json({ success: 1 });
								}
							});
						});
					}



				});

				//	});

			})

		});
	});
	function recorrerArrayAgregar(array, index, connection, res, callback) {

		if (array.length > 0) {
			let sql = "CALL modulos_agregar_insumo(?)";

			connection.query(sql, [array[index]], function (err, results) {

				if (err) {
					return connection.rollback(function () {
						//	connection.release();
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


	app.post('/update-modulo', bodyJson, checkConnection, function (req, res) {
		var idUser = null;
		if (req.user)
			idUser = req.user.id;

		/*
		connection.getConnection(function (err, connection) {
			if (err) {
				connection.release();
				res.json({ success: 0, err });
			}
			*/

		connection.beginTransaction(function (err) {
			if (err) {
				//	connection.release();
				res.json({ success: 0, err });
			}

			//  console.log("fecha: " + moment(req.body.fechaIdentificador, "MM/DD/YYYY"));
			var arrayMod = [req.body.chasis, req.body.cotizacion, req.body.descripcion, 'Cliente', 'Motivo1', req.body.id, idUser];
			connection.query("CALL modulos_modificar (?)", [arrayMod], function (err, result) {
				if (err) {
					return connection.rollback(function () {
						//	connection.release();
						res.json({ success: 5, err });
					});
				}

				connection.query("DELETE FROM modulos_plantillas WHERE id_modulo = ?", req.body.id, function (err, result2) {
					if (err) {
						return connection.rollback(function () {
							//	connection.release();
							res.json({ success: 0, err });
						});
					}


					var id_modulo_movimiento = result[0][0].id_modulo_movimiento;



					if (req.body.plantillas.length > 0) {
						plantillasAsociadas = [];
						req.body.plantillas.forEach((element, index) => {
							plantillasAsociadas.push([req.body.id, element.id]);
						});


						connection.query("INSERT into modulos_plantillas (id_modulo, id_plantilla) values ?", [plantillasAsociadas], function (err, result) {
							if (err) {
								return connection.rollback(function () {
									//	connection.release();
									res.json({ success: 0, err });
								});
							}

							recorrerArrayModificar(req.body.detalle, req.body.id, id_modulo_movimiento, idUser, 0, connection, res, function () {

								connection.commit(function (err) {
									if (err) {
										return connection.rollback(function () {
											//	connection.release();
											res.json({ success: 0, err });
										});
									} else {
										//	connection.release();
										res.json({ success: 1 });
									}
								});
							});
						});
					}
					else {
						recorrerArrayModificar(req.body.detalle, req.body.id, id_modulo_movimiento, idUser, 0, connection, res, function () {

							connection.commit(function (err) {
								if (err) {
									return connection.rollback(function () {
										//	connection.release();
										res.json({ success: 0, err });
									});
								} else {
									//	connection.release();
									res.json({ success: 1 });
								}
							});
						});
					}
				});

				//	});

			})

		});
	});

	function recorrerArrayModificar(array, id, id_modulo_movimiento, idUser, index, connection, res, callback) {

		if (array.length > 0) {
			let sql;
			let objeto = array[index];
			let arrayMod;
			if (objeto.insertado) {
				sql = "CALL modulos_agregar_insumo(?)";
				arrayMod = [objeto.cantidad_requerida, id, id_modulo_movimiento, objeto.id, index, idUser];

			} else if (objeto.modificado) {
				console.log("cantidad_requerida: " + objeto.cantidad_requerida);
				sql = "CALL modulos_modificar_cantidad_insumo(?)";
				arrayMod = [objeto.cantidad_requerida, id_modulo_movimiento, objeto.id_modulo_insumo, index, idUser];

			} else if (objeto.eliminado) {
				sql = "CALL modulos_eliminar_insumo(?)";
				arrayMod = [objeto.id_modulo_insumo, id_modulo_movimiento, idUser];

			} else if (objeto.id_modulo_insumo) {
				sql = "CALL modulos_ordenar_insumo(?)";
				arrayMod = [objeto.id_modulo_insumo, index];
			}

			connection.query(sql, [arrayMod], function (err, results) {

				if (err) {
					//console.log(err.sqlMessage);
					return connection.rollback(function () {
					//	connection.release();
					//	res.json({ success: 5, err });
					res.status(500).send(err);
					});
				}

				if (array.length > index + 1) {
					recorrerArrayModificar(array, id, id_modulo_movimiento, idUser, index + 1, connection, res, callback)
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

		connection.query("CALL modulos_listar_insumos(?)", [idModulo], function (err, result) {
			if (err) return res.json({ success: 0, error_msj: err });

			res.json({ success: 1, modulo: result[0], insumos: result[1] });

		})


	});



	function checkConnection(req, res, next) {
		console.log(connection.state);
		// connection = mysql.createConnection(dbconfig.connection);



		next();

	}


}
