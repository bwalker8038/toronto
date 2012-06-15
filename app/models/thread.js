// thread Schema
var threadSchema = new Schema({
    title: String,
    discription: String,
    creator: String,
    messages: [{type: Schema.ObjectId, ref: 'Message'}],
    date_created: {type: Date, default: Date.now()}
});


var exports = module.exports = Thread = Mongooose.model('Thread', threadSchema);