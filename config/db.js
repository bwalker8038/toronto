// Database Configuration
// ======================

/* database if not part of another module or clustered, 
 * configure the Mongoose model schemas, setting them to 
 * our database instance. The DNode middleware will need 
 * to be configured with the database references. */
 
// function will validate the presence of an object.
function validatePresenceOf (value) {
    return value  && value.length;
}

// Exports
// -------
var exports = validatePresenceOf;

// ODM Exports
var exports = Mongoose = require('mongoose');
    mongoose.connect(config.db.uri)
    
var exports = Mongoose.Schema;


