
// Toronto Messaging Server
// ========================

// Project dependencies
// --------------------
var url = require('url'),

// Application DSL/templating engine
    express = require('express'),
    jade    = require('jade'),

// Session storage
    MemStore = express.session.MemoryStore,

// Create the express application
   app = module.exports = express.createServer(),

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
    if(req.session.currentUser) {
     next();
    } else {
        res.redirect('/sessions/new?rdir=' + encodeURIComponent(req.url));
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


// Database Config, Applciation Models
// -----------------------------------

/* database if not part of another module or clustered, 
 * configure the Mongoose model schemas, setting them to 
 * our database instance. The DNode middleware will need 
 * to be configured with the database references. */

database = Mongoose.connect('mongodb://localhost:27017/toronto')

// function will validate the presence of an object.
function validatePresenceOf (value) {
    return value  && value.length;
}
// thread Schema
var threadSchema = new Schema({
    title: String,
    discription: String,
    creator: String,
    messages: [messageSchema],
    date_created: Date
});

// Message Schema
var messageSchema = new Schema({
    content: String,
    author: String,
    order: Number,
    date_created: Date
});

// User Schema
var userSchema = new Schema({
    username: { type: String, index: {unique: true}, validate: [validatePresenceOf, "username is required"]},
    hashed_password: String,
    salt: String,
    date_created: Date
});

// Before save method
userSchema.pre('save', function(next) {
    if(!validatePresenceOf(this.password)) {
        next(new Error('Password is missing'));
    } else {
        next();
    }
});

userSchema.virtual('password').set(function(password) {
    this.salt = bcrypt.genSaltSync(10);
    this._password = password;
    this.hashed_password = this.encryptPassword(password);
}).get(function() {
    return this._password;
});

// User Model Methods
userSchema.method('encryptPassword', function(password) {
    return bcrypt.hashSync(password,this.salt);
});

userSchema.method('authenticate', function(plaintext) {
    return bcrypt.compareSync(plaintext, this.hashed_password);
});

// Create the models with MongoDB
database.model('message', messageSchema);
database.model('User', userSchema); 
database.model('Thread', threadSchema);

// User model initiation
var User = database.model('User');

// Thead model initialion
var Thread = database.model('Thread');


// Routes
// ------

// Main application
app.get('/', requiresLogin, function(req, res) {
    res.render('index', {currentUser: req.session.currentUser});
});

// Threads
app.get('/threads/:id', requiresLogin, function(req, res){
    res.render('thread', {currentUser: req.session.currentUser});
});

app.get('/threads/new', requiresLogin, function(req, res){
    res.reander('threads/new', {locals: {
                 thread: new Thread(),
                 title: 'Create a new Conversation'
    }});
    
});
app.post('/threads.:format?', function(req, res){
    var thread = new Thread(req.body);
    
    function threadSaved() {
        switch (req.params.format) {
            case 'json':
                res.send(thread.doc);
            break;
            
            default:
                res.redirect('/threads/:id');
            }
    }
    
    function threadsaveFailed() {
        req.flash('warn', "thread creation failed.  Please contact support.");
        res.render('./threads/new');
    }
        
        
});

app.get('/sessions/new', function(req, res) {
    res.render('sessions/new', {locals: { 
                user: new User(),
                title: 'Sign In', 
                redir: req.query.redir 
    }}); 
});

// Sessions
app.get('sessions/destroy', function(req, res) {
    delete req.session.user;
    req.flash("You have successfully logged out.");
    res.redirect('/sessions/new');
});

app.post('/sessions', function(req, res) {
    User.findOne({ username: req.body.username }, function(err, user) {
        var rurl = '/', query = url.parse(req.url, true).query;

        if(user && user.authenticate(req.body.password)) {
            req.session.currentUser = user;
            if(query.redirect) {
                rurl = decodeURIComponent(query.redirect);
            }
            req.flash('info', 'Hello %s', user.username);
            res.redirect(rurl);
        } else {
            req.flash('warn', "Login failed.  Please check your username and/or password.");
            res.redirect('/sessions/new');
        }
    });
});

// User Creation
app.get('/users/new', function(req,res) {
    res.render('users/new', {locals: {
                user: new User(), 
                title: 'Register'
    }});
});

app.post('/users.:format?', function(req, res) {
    var user = new User(req.body);

    function userSaved() {
        switch (req.params.format) {
        case 'json':
            res.send(user.doc);
        break;

        default:
            req.session.currentUser = user;
            res.redirect('/');
        }
    }

    function userSaveFailed() {
        req.flash('warn', "User creation failed.  Please see your administrator");
        res.render('./users/new', {
                locals: {user: user}
        });
    }

    user.save(function(err) {
       if (err) {
           userSaveFailed()
       } else {
           userSaved()
       }
   });
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
