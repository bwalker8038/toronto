
// Toronto Messaging Server
// ========================

// Project dependencies
// --------------------

// Node.js File/Utilities
var utils = require('utils'),
    fs = require('fs'),
    
// Application DSL
    express = require('express'),

// Create the express application
   app = module.exports = express.createServer(),

   DNode = require('dnode'),
   BackboneDNode = require('backbone-dnode'),

   Redis = require('redis'),

// Redis instances for pub/sub
   pub = Redis.createClient(),
   sub = Redis.createClient(),

// Load Application Configuration
    config_file = require('yaml-config');
    exports = module.exports = config = config_file.readConfig('config/config.yaml');

// Load Database Config
require('/config/db.js');

// Load Models
var models_path = __dirname + '/app/models',
    model_files = fs.readdirSync(models_path);
    
model_files.forEach(function() {
    if(file == 'user.js') {
        User = require(models_path+'/'+file);
    } else {
        require(models_path+'/'+file);
    }
});

// Bootstrap the application
require('/config/config').boot(app);

// Auth Handler
// -------------
function requiresLogin(req, res, next) {
    if(req.session.currentUser) {
     next();
    } else {
        res.redirect('/sessions/new?rdir=' + encodeURIComponent(req.url));
    }
}

// Load Routes
// -----------
require('/app/routes.js');


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
      console.log('Conn Error: ', e.stack)
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
