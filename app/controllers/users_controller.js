// Users Controller
// ================


// Import User Model
var User = Mongoose.model('User');

module.exports = function(app) {
    
// Create New User Account
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