// Thread Controller
// =================

var Thread = mongoose.model('Thread'),
    Message = mongoose.model('Message');
    
module.exports = function(app) {
    app.get('/thread/:id.:format?', requiresLogin, function(req, res){
        
        Thread.findOne({__id: req.params.id, user_id: req.currentUser.id}, function(err, thread) {
            if(!thread) return next(new NotFound('Thread not Found')); 
            
            switch (req.params.format) {
                case 'json':
                    res.send(thread.toObject());
                break;
                
            default:
                res.render('threads/show', {currentUser: req.session.currentUser});
             }
        });
        
    });

    app.get('/thread/new', requiresLogin, function(req, res){
        res.render('threads/new', {locals: {
                     thread: new Thread(),
                     title: 'Create a new Conversation'
        }});
    
    });
    app.post('/threads.:format?', function(req, res){
        var thread = new Thread(req.body);
    
        function threadSaved() {
            switch (req.params.format) {
                case 'json':
                    res.send(thread.toObject());
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
}
