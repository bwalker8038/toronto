// Sessions Controller
// ===================

// Import User Model
var User = mongoose.model('User');

module.exports = function(app) {

// Create Session at User Sign In
    app.get('/sessions/new', function(req, res) {
        res.render('sessions/new', {locals: { 
                    user: new User(),
                    title: 'Sign In', 
                    redir: req.query.redir 
        }}); 
    });
    
// Destroy Session at User Sign Off
    app.get('sessions/destroy', function(req, res) {
        delete req.session.user;
        req.flash("You have successfully logged out.");
        res.redirect('/sessions/new');
    });

// POST Session Handler
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
};