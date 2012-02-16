
// Toronto Messaging Server
// ========================

// Project dependencies
// --------------------
var express = require('express'),
    jade    = require('jade'),

// Session storage
    MemStore = express.session.MemoryStore,

// Form handling
   form = require('connect-form'),

// Create the express application
   app = module.exports = express.createServer(
          form({keepExtensions: true})
   ),

   DNode = require('dnode'),
   BackboneDNode = require('backbone-dnode'),


// Encryption Module
   bcrypt = require('bcrypt'),

// Database ODM dependencies
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


database.model('message', messageSchema);
database.model('User', {
    properties: ['username', 'hashed_password', 'salt'],

    indexes: [
        [{username: 1}, {unique: true }]
    ],

    getters: {
        id: function() {
            return this._id.toHexString();
        },

        password: function() { return this._password; }

    },

    
    setters: {
        password: function(password) {
            this._password = password;
            this.salt = bcrypt.genSaltSync(10);
            this.hashed_password = this.encryptPassword(password);
        }
    },

    methods: {
        encryptPassword: function(password) {
            return bcrypt.hashSync(password, this.salt);
        },
        
        authenticate: function(password) {
            return bcrypt.compareSync(password, this.hashed_password);
        },

        save: function(okFn, failedFn) {
            if(this.isValid()) {
                this.__super__(okFn);
            } else {
                failedFn();
            }
        }
    }
});


// Routes
// ------

// Main application
app.get('/', requiresLogin, function(req, res) {
    res.render('index');
});

app.get('/sessions/new', function(req, res) {
    res.render('sessions/new', {locals: { 
                user: new User(),
                redir: req.query.redir 
    }}); 
});

app.get('sessions/destroy', function(req, res) {
    delete req.session.user;
    req.flash("You have successfully logged out.");
    res.redirect('/sessions/new');
});

app.post('/sessions', function(req, res) {
    User.find({ username: req.body.username }).first(function(user) {
        if(user && user.authenticate(req.body.password)) {
            req.session.user = user.username;
            res.redirect(req.body.rdir || '/');
        } else {
            req.flash('warn', "Login failed.  Please check your username and/or password.");
            res.redirect('/sessions/new');
        }
    });
});

app.get('/users/new', function(req,res) {
    res.render('users/new.jade', {locals: {
                user: new User()
    }});
});

app.post('/users', function(req, res) {
    var user = new User(req.body.user);

    function userSaved() {
        switch (req.params.format) {
        case 'json':
            res.send(user.__doc);
        break;

        default:
            req.session.user = user.name
            res.redirect('/');
        }
    }

    function userSaveFailed() {
        req.flash('warn', "User creation failed.  Please see your administrator");
        res.render('users/new', {
                locals: {user: user}
        });
    }

   user.save(userSaved, userSaveFailed);
});

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
