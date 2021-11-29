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
mongoose.connect('mongodb://localhost:27017/test');

const Cat = mongoose.model('Cat', {name: String});

const kitty = new Cat({name: 'Zildjian'});
kitty.save().then(() => console.log('meow'));

const botSchema = new Schema({
    nome: {
        type: String,
        required: false
    },
});
