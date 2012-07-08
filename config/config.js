// Application Configuration
// =========================

// Configuration Dependencies
// --------------------------

// Application DSL/ Session Storage
var express = require('express'),
    mongoStore = require('connect-mongodb'),
    
// Static Assest Minifiers/Compressors
    expressUglify = require('express-uglyify'),
    gzippo = require('gzippo');


// Application Bootstrap
// ---------------------

// export app configuration
exports.boot = function(app) {
    bootApplication(app);
};

// Function will bootstrap the application configuration
function bootApplication(app) {
    app.configure(function() {
        
        // View Settings
        app.set('views', __dirname + 'app/views');
        app.set('view engine', 'jade');
        app.set('view options', {layout: 'layout/main'});
        
        // Express/Session Settings
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.cookieParser());
        app.use(express.session({
            secret: '7be61178eee66c23720c6d5098c66372',
            store: new mongoStore({
                url: config.db.uri,
                collection: 'sessions'
            })
        }));
        
        // Logger Settings
        app.use(express.logger(':method :url :status'));
        
        // favicon
        app.use(express.favicon());
    });
        
        
    // Stack errors set to false as default
    app.set('showStackError', false);
    
    // Environment Settings
    app.configure('development', function() {
        app.set('showStackError', true);
        app.set('dumpExceptions', true);
        app.use(express.static(__dirname + '/public'));
    });
    
    app.configure('staging', function() {
        app.use(expressUglify.middleware({
            src: __dirname + '/public/js'
        }));
        app.use(gzippo.staticGzip(__dirname + '/public'));
    });
    
    app.configure('production', function() {
        app.use(expressUglify.middleware({
            src: __dirname + '/public/js'
        }));
        app.use(gzippo.staticGzip(__dirname + '/public'));
    });
}
   
  