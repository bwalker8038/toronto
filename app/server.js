
// Toronto Messaging Server
// ========================

// Project dependencies
// --------------------
var express = require('express'),
    jade    = require('jade'),

// Session storage
    MemStore = express.session.MemoryStore,

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
// --------------------
app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());

  app.use(express.session({secret: 'secret_key', 
                           store: MemStore({reapInterval: 60000 *10 })
  }));

  app.use(express.static(__dirname))
  app.use(express.static(__dirname + '/../vendor/'));
  app.use(express.static(__dirname + '/../../browser/'));
  app.use(express.static(__dirname + '/static'));

  // Debugging settings/error handling
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true 
  }));
});

// View engine options
app.set('view engine', 'jade');

app.set('view options', {
  layout: false
});

// Auth Handlers
// -------------
function requiresLogin(req, res, next) {
  if(req.session.user) {
   next();
  } else {
    res.redirect('/sessions/new?rdir=' + req.url);
  }
};

function authenticate(username, password, callback) {
    // authentication function goes here
};

// Helpers
// -------
app.dynamicHelpers({
  session: function(req,res){
    return req.session;
  },
  flash: function(req,res){
    return req.flash();
  }
});


// Routes
// ------

// Main application
app.get('/', requiresLogin, function(req, res) {
    res.render('index.jade');
});

app.get('/sessions/new', function(req, res) {
    res.render('sessions/new', {locals: { 
                                   redir: req.query.redir }
    }); 
});

app.get('sessions/destroy', function(req, res) {
    delete req.session.user;
    req.flash("You have successfully logged out.");
    res.redirect('/sessions/new');
});

app.post('/sessions', function(req, res) {
    users.authenticate(req.body,login, req.body.password, function(user){
        if(user) {
          req.session.user = user;
          res.redirect(req.body.rdir || '/');
        } else {
          req.flash('warn', "Login failed.  Please check your username/password.");
          res.render('sessions/new', {locals: {
                                        redir: req.query.redir
                                     }
          });
        }
    }); 
});

app.get('/user/new', function(req,res) {
    res.render('new.jade');
});


// Start up the application and connect to the mongo 
// database if not part of another module or clustered, 
// configure the Mongoose model schemas, setting them to 
// our database instance. The DNode middleware will need 
// to be configured with the database references.
database = Mongoose.connect('mongodb://localhost:27017/toronto')

var messageSchema = new Schema({
  content: String,
  order: Number
});

var userSchema = new Schema({
  username: String,
  password: String
});

database.model('message', messageSchema);
database.model('user', userSchema);

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
