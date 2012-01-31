
// Basic Server
// ============

// Include all project dependencies
var express = require('express'),
    jade    = require('jade'),

// Create the express application
    app = module.exports = express.createServer(),

    DNode = require('dnode'),
    BackboneDNode = require('backbone-dnode'),

    Mongoose = require('mongoose'),
    Schema   = Mongoose.Schema,

    Redis = require('redis'),

// Redis instances for pub/sub
    pub = Redis.createClient(),
    sub = Redis.createClient();

// Server configuration
app.configure(function() {
    app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());

  app.use(express.static(__dirname))
  app.use(express.static(__dirname + '/../vendor/'));
  app.use(express.static(__dirname + '/../../browser/'));
  app.use(express.static(__dirname + '/static'));

  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true 
  }));
});

app.set('view options', {
  layout: false;
});


// Routes
// ------

// Main application
app.get('/', function(req, res) {
    res.render('/index.jade');
});

// Start up the application and connect to the mongo 
// database if not part of another module or clustered, 
// configure the Mongoose model schemas, setting them to 
// our database instance. The DNode middleware will need 
// to be configured with the database references.
database = Mongoose.connect('mongodb://localhost:27017/db')

var messageSchema = new Schema({
  content: String,
  done: Boolean,
  order: Number
});

database.model('message', MessageSchema);


// Initialize
// ----------

// Start up the server
app.listen(8000, function() {
    console.log("Server configured for: " + (global.process.env.NODE_ENV || 'development') + " environment.");
  console.log("Server listening on port: " + app.address().port);
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
