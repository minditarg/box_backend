exports.checkPermission = function(req,res,next,arrayPermission,connection) {
  if(req.user)
   {
     if(arrayPermission.length > 0) {
     connection.query("CALL users_listar_accesos(?)",req.user.id,function(err,result){
       if(err){
         return res.status(500).send("error de consulta SQL");
       }
       let arrayResult = JSON.parse(JSON.stringify(result[0]));
       let indexEncontrado = arrayResult.findIndex(elem => {
         return arrayPermission.indexOf(parseInt(elem.id_acceso)) > -1

       });
       if(indexEncontrado < 0){
         return res.status(406).send("No posee permisos para acceder a esta sección");
       }
       next();
     })
   } else {
     next();
   }

   }
   else
   {
   res.status(401).send("No inició sesión en la aplicación");
   }


}
