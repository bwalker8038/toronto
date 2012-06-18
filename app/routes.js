// Application Routes
// ==================

// Load Models
var User = Mongoose.model('User'),
    Thread = Mongoose.model('Thread'),
    Message = Mongoose.model('Message');
    

// Routes
module.exports = function(app) {
    
// Main application
    app.get('/', requiresLogin, function(req, res) {
        res.render('index', {currentUser: req.session.currentUser});
    });

// Threads
    app.get('/thread/:id', requiresLogin, function(req, res){
        res.render('thread', {currentUser: req.session.currentUser});
    });

    app.get('/thread/new', requiresLogin, function(req, res){
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
}