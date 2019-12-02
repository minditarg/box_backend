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


  app.post('/delete-modulos', bodyJson,checkConnection, function (req, res) {
    try {
      connection.query("UPDATE modulos set activo = 0 where id = ?", [req.body.id], function (err, result) {
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
			var arrayIns = [req.body.chasis, req.body.descripcion];
			connection.query("INSERT INTO modulos (chasis, descripcion) VALUES (?,?)", arrayIns, function (error, result) {
				if (error) {
					return connection.rollback(function () {
						connection.release();
						throw error;
					});
				}

				var insertedId = result.insertId;

				var sql = "INSERT INTO modulos_insumos (id_modulo, id_insumo, cantidad_asignada, activo) VALUES ?";
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

	app.get('/list-modulos-insumos/:idModulo', checkConnection, function (req, res) {
		var idModulo = req.params.idModulo;

		connection.query("SELECT * FROM modulos m  WHERE m.activo = 1 AND m.id = ? ", [idModulo], function (err, resultModulo) {
			if (err) return res.json({ success: 0, error_msj: err });

			connection.query("SELECT i.*,mi.cantidad_asignada,mi.id as id_modulos_insumos,ic.codigo FROM modulos_insumos mi LEFT JOIN insumos i ON i.id = mi.id_insumo LEFT JOIN insumos_categorias ic ON i.id_insumos_categorias = ic.id  WHERE mi.activo = 1 AND mi.id_modulo = ? ", [idModulo], function (err, resultInsumos) {
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
