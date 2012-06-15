var bcrypt = require('bcrypt');

// User Schema
var userSchema = new Schema({
    username: { type: String, index: {unique: true}, validate: [validatePresenceOf, "username is required"]},
    email: {type: String, unique: true},
    hashed_password: String,
    salt: String,
    date_created: {type: Date, default: Date.now() }
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


var exports = module.exports = User = Mongoose.model('User', UserSchema);