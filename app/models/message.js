// Message Schema
var messageSchema = new Schema({
    content: String,
    author: [{type: Schema.ObjectId, ref: 'User'}],
    order: Number,
    date_created: {type: Date, default: Date.now()}
});

var exports = module.exports = Message = Mongoose.model('Message', messageSchema);