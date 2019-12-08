var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()


module.exports = function (app, connection, passport) {


	app.get('/me', checkConnection, function (req, res) {
		var user = req.user;

		if (!req.isAuthenticated())
			return res.json({ success: 3, error_msj: "no esta autenticado" });
		// if they aren't redirect them to the home page
		connection.query("SELECT * FROM users_type ut LEFT JOIN users_type_accesos uta ON ut.id=uta.id_user_type LEFT JOIN accesos a ON a.id = uta.id_acceso WHERE ut.id = ?", [user.id_users_type], function (err, result) {
			if (err) {
				return res.json({ success: 0, error_msj: err });
			}
			else {

				res.json({ success: 1, user, result });
			}
		})



	});


	app.post('/update-configuracion', bodyJson, checkConnection, function (req, res) {
		var userId = null;
		if (req.user)
			userId = req.user.id;

		if (req.body.id) {
			var id_insumo = parseInt(req.body.id);
			var objectoUpdate = { alertaCosto: req.body.alertaCosto };
			connection.query("UPDATE configuraciones SET ? where id = ?", [objectoUpdate, id_insumo], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar insumo", err });
				else {
					res.json({ success: 1, result });
				}

			});
		} else {
			res.json({ success: 0, error_msj: "el id de la tabla insumo no esta ingresado" })

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
