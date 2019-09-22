// app/routes.js
const nodemailer = require('nodemailer');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);
var connection_mult = mysql.createConnection(dbconfig.connection_mult);
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, callback) {

		callback(null, './uploads/');
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now());
	}
});
var upload = multer({ storage: storage }).single('userPhoto');
var bodyUrlencoded = bodyParser.urlencoded({
	extended: true
});
var bodyJson = bodyParser.json()



connection.query('USE ' + dbconfig.database);
connection_mult.query('USE ' + dbconfig.database);

module.exports = function (app, passport) {



	app.get('/me', isLoggedIn, function (req, res) {

		var user = req.user;
		res.json({ success: 1, user }); // load the index.ejs file
	});


	app.post('/login-json', bodyJson, accessControl, function (req, res) {
		try {
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
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}
	});


	app.post('/signup-json', bodyJson, accessControl, function (req, res) {
		try {
			passport.authenticate('local-signup', function (err, user, info) {
				if (err) { return res.json({ success: 0, error_msj: "no se pudo autenticar" }, err) }
				if (!user) { return res.json({ success: 0, error_msj: "Posible nombre de usuario duplicado" }) }

				return res.json({ success: 1, user });

			})(req, res);
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}

	});


	app.get('/list-users/:idUser', function (req, res) {
		try {
			var idUser = req.params.idUser;
			connection.query("SELECT * FROM users u LEFT JOIN users_type as ut ON u.id_users_type = ut.id WHERE u.id = ?", [idUser], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, result });
			});
		} catch (e) { }
		return res.status(500).send({
			error: true,
			message: e.message
		})
	});

	app.get('/list-users', function (req, res) {
		try {
			connection.query("SELECT ut.*,u.* FROM users u LEFT JOIN users_type as ut ON u.id_users_type = ut.id ", function (err, result) {

				if (err) return res.json({ success: 0, error_msj: err });
				res.json({ success: 1, result });
			});
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}

	});

	app.post('/update-user', bodyJson, function (req, res) {
		try {
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
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}
	});



	// route middleware to make sure
	function isLoggedIn(req, res, next) {
		// if user is authenticated in the session, carry on
		if (req.isAuthenticated())
			return next();
		// if they aren't redirect them to the home page
		res.json({ success: 3, error_msj: "no esta autenticado" });
	}

	function isAdmin(req, res, next) {
		// if user is authenticated in the session, carry on
		if (req.user.id_users_type == 1)
			return next();
		// if they aren't redirect them to the home page
		res.json({ success: 4, error_msj: "no esta autenticado" });
	}


	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});



	///INSUMOS///
	app.get('/list-insumos', function (req, res) {

		try {
			connection.query("SELECT * FROM insumos WHERE activo=1", function (err, result) {
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

	app.get('/select-insumos/:id', function (req, res) {
		try {
			connection.query("SELECT * FROM insumos WHERE id=?", [req.params.id], function (err, result) {
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


	app.post('/delete-insumos', bodyJson, function (req, res) {
		try {
			connection.query("UPDATE insumos set activo = 0 where id = ?", [req.body.id], function (err, result) {
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


	app.post('/insert-insumos', bodyJson, function (req, res) {
		try {
			var arrayIns = [, req.body.codigo, req.body.descripcion, 1];
			connection.query("INSERT INTO insumos VALUES (?,?,?,?)", arrayIns, function (err, result) {

				if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar un insumo", err });
				res.json({ success: 1, result });
			})
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}
	});
	///INSUMOS///

	///PEDIDOS///
	app.get('/list-pedidos', function (req, res) {

		try {
			connection.query("SELECT * FROM pedidos p INNER JOIN users u ON p.id_user=u.id WHERE activo=1", function (err, result) {
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


	app.post('/delete-pedidos', bodyJson, function (req, res) {
		try {
			connection.query("UPDATE pedidos set activo = 0 where id = ?", [req.body.id], function (err, result) {
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


	app.post('/insert-pedidos', bodyJson, function (req, res) {
		try {
			connection.beginTransaction(function(err) {
				if (err) { throw err; }

				var datenow = new Date();
				var arrayIns = [, 1, req.body.codigo, req.body.descripcion, datenow, 1];
				connection.query("INSERT INTO pedidos VALUES (?,?,?,?,?,?)", arrayIns, function (error, result) {
					if (error) {
					return connection.rollback(function() {
					  throw error;
					});
				  }

				console.log(result.insertId);
				var insertedPedido = result.insertId;

				var sql = "INSERT INTO pedidos_detalles (id_pedido, id_insumo, unidad, cantidad, activo) VALUES ?";
				var values = [];
				req.body.detalle.forEach(element => {
					values.push([insertedPedido, element.id, 99, 83, 1]);
				});
				
				  connection.query(sql, [values], function (error, results) {
					
					if (error) {
					  return connection.rollback(function() {
						throw error;
					  });
					}
					connection.commit(function(err) {
					  if (err) {
						return connection.rollback(function() {
						  throw err;
						});
					  }
					  console.log('success!');
					  res.json({ success: 1, results });
					});
				  });
				});
			  });
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}
	});
	///PEDIDOS///

	//INSERT INTO `boxrental`.`insumos` (`codigo`, `descripcion`) VALUES ('pla', 'placa 100');

	/*
	app.post('/insert-user',isLoggedIn,function(req,res){
		var datenow = new Date();
		var arrayIns=[,req.body.nombre,req.body.apellido,req.body.dni,req.body.tipos_insercion,datenow,req.body.foto,req.body.estado,req.body.estado_acred];
	  connection.query("INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)",arrayIns ,function (err, result) {
		if (err) return res.json({success:0,error_msj:"ha ocurrido un error al intentar insertar en la tabla users",err});
		res.json({success:1,result});
	  });

	});
*/

	app.get('/list-users_type', function (req, res) {
		try {
			connection.query("SELECT * FROM users_type", function (err, result) {
				if (err) {
					return res.json({ success: 0, error_msj: err });
				}
				else{

					res.json({ success: 1, result });
				}
				
			})
		} catch (e) {
			return res.status(500).send({
				error: true,
				message: e.message
			})
		}

	});



	/**********************************/
	/**********************************/
	/**********************************/
	/**********************************/

	app.post('/imagen', bodyJson, isLoggedIn, function (req, res) {
		upload(req, res, function (err, file) {
			if (err) {
				return res.json({ success: 0, error_msj: "ocurrió un error al subir la imagen", err });
			}
			res.json({ success: 1, message: "la imagen se ha subido con éxito" });
		});
	});



	//list-users-2 no es la forma mas eficiente de recorrer el array de resultados
	app.get('/list-users-2', isLoggedIn, function (req, res) {
		connection_mult.query("SELECT * FROM users order by id;SELECT * FROM users_sectores order by id_users", function (err, result) {
			if (err) return res.json({ success: 0, error_msj: err });

			var resultado = result[0];

			resultado.forEach(function (elementUser, index) {
				elementUser.sectores = [];

				var indexArray = result[1].findIndex(function (elementSectores) {

					return elementUser.id == elementSectores.id_users

				})

				if (indexArray > -1) {
					while (result[1][indexArray].id_users == elementUser.id) {
						console.log(indexArray);
						elementUser.sectores.push(result[1][indexArray]);

						if (indexArray >= result[1].length - 1)
							break;

						indexArray = indexArray + 1;
					}
				}
			})



			res.json({ success: 1, resultado });
		});

	});


	app.get('/list-users2', function (req, res) {
		var query = `SELECT * FROM users AS us LEFT JOIN  estado as es ON us.id_estado = es.id_estado LEFT JOIN users_sectores AS uss ON uss.id_users = us.id LEFT JOIN sectores AS sec ON uss.id_sectores = sec.id_sectores order by us.id `;
		connection.query(query, function (err, result) {
			if (err) return res.json({ success: 0, error_msj: err });

			var array_result = [];
			var prevId = null;
			console.log(result);
			result.forEach(function (element, index) {
				if (prevId == null || prevId != element.id) {
					array_result.push({
						id: element.id,
						username: element.username,
						nombre: element.nombre,
						apellido: element.apellido,
						sectores: [
						]

					})

					if (element.id_users_sectores != null)
						array_result[array_result.length - 1].sectores.push({
							id_sectores: element.id_sectores,
							desc_sectores: element.desc_sectores,
							id_eventos: element.id_eventos

						});


				} else {
					array_result[array_result.length - 1].sectores.push({
						id_sectores: element.id_sectores,
						desc_sectores: element.desc_sectores,
						id_eventos: element.id_eventos

					})


				}

				prevId = element.id;


			})


			res.json({ success: 1, array_result });
		});

	});


	app.post('/insert-user', isLoggedIn, function (req, res) {
		var datenow = new Date();
		var arrayIns = [, req.body.nombre, req.body.apellido, req.body.dni, req.body.tipos_insercion, datenow, req.body.foto, req.body.estado, req.body.estado_acred];
		connection.query("INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)", arrayIns, function (err, result) {
			if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar en la tabla users", err });
			res.json({ success: 1, result });
		});

	});



	app.post('/insert-user-sector', isLoggedIn, function (req, res) {
		var arrayIns = [req.body.id_users, req.body.id_sectores];
		arrayIns = arrayIns.concat(arrayIns);
		var query = `INSERT INTO users_sectores (id_users, id_sectores)
SELECT * FROM (SELECT ?,?) AS tmp
WHERE NOT EXISTS (
    SELECT id_users,id_sectores FROM users_sectores WHERE id_users = ? AND id_sectores = ?
) LIMIT 1;`;

		connection.query(query, arrayIns, function (err, result) {
			if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar insertar en la tabla users", err });
			res.json({ success: 1, result });
		});

	});


	app.post('/update-user', isLoggedIn, function (req, res) {
		if (req.body.id_users) {
			var id_users = parseInt(req.body.id_users);
			var objectoUpdate = { nombre: req.body.nombre, apellido: req.body.apellido, dni: req.body.dni, foto: req.body.foto };
			connection.query("UPDATE users SET ? where id = ?", [objectoUpdate, id_users], function (err, result) {
				if (err) return res.json({ success: 0, error_msj: "ha ocurrido un error al intentar actualizar users", err });
				res.json({ success: 1, result });
			});
		} else {
			res.json({ success: 0, error_msj: "el id de la tabla users no esta ingresado" })

		}
	});







	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	//	app.get('/',loginRedirectsolicitud, function(req, res) {
	//	res.render('index.ejs'); // load the index.ejs file
	//});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function (req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/solicitud', // redirect to the secure profile section
		failureRedirect: '/login', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}),
		function (req, res) {
			if (req.body.remember) {
				req.session.cookie.maxAge = 1000 * 60 * 3;
			} else {
				req.session.cookie.expires = false;
			}
			res.redirect('/');
		});

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function (req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.get('/solicitud', isLoggedIn, function (req, res) {

		// render the page and pass in any flash data if it exists
		res.render('solicitud-form.ejs', { message: req.flash('solicitudMessaje'), user: req.user });
	});

	app.post('/solicitud', isLoggedIn, sendMail, function (req, res) {
		// render the page and pass in any flash data if it exists
		res.render('solicitud-ok.ejs');
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/profile', // redirect to the secure profile section
		failureRedirect: '/signup', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));




	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function (req, res) {
		res.render('profile.ejs', {
			user: req.user // get the user out of session and pass to template
		});
	});




};




// route middleware to make sure

function loginRedirectsolicitud(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return res.redirect('/solicitud');


	next();

	// if they aren't redirect them to the home page

}

function accessControl(req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();


}


function sendMail(req, res, next) {

	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing

	// create reusable transporter object using the default SMTP transport
	var transporter = nodemailer.createTransport({
		host: '172.20.2.10',
		port: 25

	});

	connection.query("SELECT * FROM users_mail ", function (err, rows) {

		console.log(req.body);
		//req.flash('solicitudMessaje', 'holaaaaa')
		console.log(rows);
		var to_mail = [];
		for (var i in rows) {
			to_mail.push(rows[i].mail)
		}

		var message_body = "<p>Pelado, quiero que me crees una cuenta a " + req.body.solicitudnombre + " " + req.body.solicitudapellido + "</p>";



		let mailOptions = {
			from: '"mailutn" <mailutn@rec.utn.edu.ar>', // sender address
			to: to_mail, // list of receivers
			subject: 'Hello', // Subject line
			html: message_body // html body
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				req.flash('solicitudMessaje', 'Ha ocurrido un error vuelva a intentar en otro momento')
				return res.redirect('/solicitud');
			}
			console.log('Message sent: %s', info.messageId);
			// Preview only available when sending through an Ethereal account
			console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
			next();

			// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
			// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
		});




	})


}
