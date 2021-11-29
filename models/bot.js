// https://www.youtube.com/watch?v=bxsemcrY4gQ
/*
username = doadmin
password = 69f7g4dYoP8I23p1 hide
host = db-mongodb-ams3-34537-4eea409b.mongo.ondigitalocean.com
port = 27017
database = admin
protocol = mongodb+srv
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema


const uri = 'mongodb+srv://egeominotti:cevfag12@cluster0.64cwx.mongodb.net/myFirstDatabase?retryWrites=true&w=majorit';

mongoose.connect(uri);

const botSchema = new Schema({
    nome: {
        type: String,
        required: false
    },
});


const test = mongoose.model('Bot', botSchema)

const t = new test({
    nome: 'egeo'
})

t.save().then((result) => {
    console.log(result)
}).catch((err) => {
    console.log(err)
});

//module.exports = mongoose.model('Bot', botSchema)
