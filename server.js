
// Toronto Messaging Server
// ========================

// Project dependencies
// --------------------

// File/Path Handling
var fs = require('fs'),
    
// Url Handling
    url = require('url'),
    
// Application DSL
    express = require('express'),

// Create the express application
   app = module.exports = express.createServer(),

   DNode = require('dnode'),
   BackboneDNode = require('backbone-dnode');


// Load Application Configuration
// ------------------------------
var env  = process.env.NODE_ENV || 'development';
var yaml = require('yaml-config');
    exports = module.exports = config = yaml.readConfig('./config/config.yaml', env);


// Load Dynamic Helpers
// --------------------
var helper_path = __dirname + '/app/helpers',
    helper_file = fs.readdirSync(helper_path);

helper_file.forEach(function(file) {
    require(helper_path+'/'+file)(app);
});


// Load Database Config
// --------------------
require('./config/db.js');


// Load Models
//------------
var models_path = __dirname + '/app/models',
    model_files = fs.readdirSync(models_path);
    
model_files.forEach(function(file) {
    if(file == 'user.js') {
        User = require(models_path+'/'+file);
    } else {
        require(models_path+'/'+file);
    }
});


// Bootstrap the application
// -------------------------
require('/config/config').boot(app);


// Load Controllers
// ----------------
var controllers_path = __dirname + '/app/controllers',
    controller_files = fs.readdirSync(controllers_path);
    
controller_files.forEach(function(file) {
    require(controllers_path+'/'+file)(app);
});


// Initialize
// ----------

// Start up the server
var port = process.env.PORT || 8000;
    
app.listen(port, function() {
    console.log("Server configured for: " + (global.process.env.NODE_ENV) + " environment.");
    console.log("Server listening on port: " + port);
});


// General error handling
function errorHandler(client, conn) {
    conn.on('error', function(e) {
      console.log('Conn Error: ', e.stack);
    });
}

// Attatch the DNode middleware and connect
DNode()
    .use(errorHandler)
    .use(BackboneDNode.pubsub({
      publish: pub,
      subscribe: sub
    }))
    .use(BackboneDNode.crud({
      database: database
    }))
    .listen(app);