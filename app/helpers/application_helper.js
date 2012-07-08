// Application Dynamic Helpers
// ===========================

module.exports = function(app) {
    
    app.dynamicHelpers({
        request: function(req){
            return req;
        },
        
        hasMessages: function(req) {
            if(!req.session) return false;
            return Object.keys(req.session.flash || {}).length;
        },
        
        messages: require('express-messages'),
        
        base: function() {
            return '/' == app.route ? '' : app.route;
        }
    }); 
};
