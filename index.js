const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");

const mySecretUri = process.env['MONGO_URI']
mongoose.connect(mySecretUri, { useNewUrlParser: true, useUnifiedTopology: true });

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))

let User;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

User = mongoose.model('User', userSchema);

let Exercise;
const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number, 
  date: Date
});

Exercise =  mongoose.model("Exercise", exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
});

app.post('/api/users', async function (req, res) {
  const { username } = req.body;
  var user = new User({username: username})
  try{
    let savedUser = await user.save();
    res.json(savedUser);
  }
  catch(err){
    res.json({error: err});
  }
  
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, docs) => {
     if(err){
         console.log(`Error: ` + err)
     } else{
       if(docs.length === 0){
        res.json({});
       } else{
         res.send(Object.values(docs));
       }
     }
  });
})

app.post('/api/users/:_id/exercises', async function (req, res) {
  const { description, duration, date } = req.body;
  let user = await User.findById(
    req.params._id
  , (err, doc) => {
     if(err){
         res.send(`Error: ` + err)
     } else{
       if(!doc){
           res.send("Could not find user")
       } else{
         return doc
       }
     }
  });

  var exercise = new Exercise({user_id: user._id , description: description, duration: duration, date: date ? new Date(date).toDateString() : new Date().toDateString()})
  try{
    let savedExercise = await exercise.save();
    res.json({...savedExercise._doc, ...user._doc});
  }
  catch(err){
    console.log({error: err});
  }
  
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} =  req.query;
  let user = await User.findById(
      req.params._id
  , (err, doc) => {
     if(err){
         console.log(`Error: ` + err)
     } else{
       if(!doc){
           console.log("message")
       } else{
         return doc
       }
     }
  });
  let dateObj = {};
  if(from){
    dateObj["$gte"] =  new Date(from);
  }
  if(to){
    dateObj["$lte"] =  new Date(to);
  }
  let filter = {
    user_id : user._id
  }
  if(from || to){
    filter.date = dateObj
  }
  let exercises = await Exercise.find(filter, (err, docs) => {
     if(err){
         console.log(`Error: ` + err)
     } else{
       if(docs.length === 0){
           console.log("message")
       } else{
         return docs
       }
     }
  }).limit(+limit ?? 500);
  let logs = exercises.map(exercise => {return {description: exercise.description, duration: exercise.duration, date: exercise.date.toDateString()}})
  res.json({username: user.username, _id: user._id, count: exercises.length, log: logs});
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
