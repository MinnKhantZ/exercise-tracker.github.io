const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const asyncHandler = require('express-async-handler');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://minkhant:zaw@cluster0.hbuus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(()=>{
  console.log("Database connected!");
})
.catch((err)=>{
  console.error(err);
});

const exerciseSchema = new mongoose.Schema(
  {
    username: String,
    count: {type: Number, default: 0},
    log: [{
      description: String,
      duration: Number,
      date: String,
      _id: false
    }]
  }, {versionKey: false}
);

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', asyncHandler(async (req, res, next) => {
  const newUser = new Exercise({username: req.body.username});
  newUser.save().then((data)=>{
    res.json({
      username: data.username,
      _id: data._id
    });
  });
}));

app.get('/api/users', asyncHandler(async (req, res, next) => {
  const users = await Exercise.find({}).exec();
  res.json(users.map(obj=>({
    _id: obj._id,
    username: obj.username
  })));
}));

app.post('/api/users/:_id/exercises', asyncHandler(async (req, res, next) => {
  if (!req.body.date) {
    var newDate = new Date();
  } else {
    var newDate = new Date(req.body.date);
  }
  newDate = newDate.toDateString();
  const result = await Exercise.findByIdAndUpdate(req.params._id, {
    $push: {
      log: {
        description: req.body.description,
        duration: req.body.duration,
        date: newDate
      }
    },
    $inc: {count: 1}
  }, {new: true});
  res.json({
    username: result.username,
    description: result.log[result.log.length-1].description,
    duration: result.log[result.log.length-1].duration,
    date: result.log[result.log.length-1].date,
    _id: result._id
  });
}));

app.get('/api/users/:_id/logs', asyncHandler(async (req, res, next) => {
  const exercises = await Exercise.findById(req.params._id).exec();
  if (req.query.from&&req.query.to) {
    const fromDate = new Date(req.query.from);
    const toDate = new Date(req.query.to);
    exercises.log = exercises.log.filter(obj => {
      const objDate = new Date(obj.date);
      return objDate >= fromDate && objDate <= toDate;
    });
  }
  if (req.query.limit&&exercises.log.length>req.query.limit) {
    exercises.log.splice(req.query.limit);
  }
  res.json(exercises);
}));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
