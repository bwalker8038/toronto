// Users Controller
// ================


// Import User Model
var User = Mongoose.model('User');

module.exports = function(app) {

// Show the users Profile
    app.get('/users/:username.:format?', requiresLogin, function(req, res) {
        User.findOne({__id:req.params.id, user_id: req.currentUser.id}, function(err, user) {
           if(!user) return next(new NotFound('User not Found')); 
           
            switch (req.params.format) {
                case 'json':
                    res.send(user.toObject());
                break;
                
                default:
                    res.render('users/show', {user: user, currentUser: req.session.currentUser});
            }
        });
    });
    

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
                res.send(user.toObject());
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
               userSaveFailed();
            } else {
                userSaved();
            }
         });
    });
};