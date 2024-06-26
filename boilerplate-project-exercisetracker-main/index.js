const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config({path: __dirname + "\\sample.env"});
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

let userSchema = new mongoose.Schema({
  username: String
});

let exerciseSchema = new mongoose.Schema({
  idUser: String,
  username: String,
  date: {type: Date, default: new Date()},
  duration: Number,
  description: String
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(express.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users", async (req, res) => {
  try {
    let user = new User({
      username: req.body['username']
    });
    const data = await user.save(); // Guardar el usuario usando await
    res.status(201).json(data); // Devuelve el usuario creado en formato JSON
  }
  catch (err){
    res.json({ error: err.message });
  }
  
  });

app.post("/api/users/:_id/exercises", async (req, res) => {
  try{
    const objectId = new mongoose.Types.ObjectId(req.params._id)
    console.log(objectId)
    let userById = await User.findById(objectId);
    let exercise = new Exercise({
      idUser: userById._id,
      username: userById.username,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      duration: Number(req.body['duration']),
      description: req.body['description']
    });
    const data = await exercise.save();
    res.status(201).json({_id: userById._id, 
                          username: userById.username, 
                          date: new Date(req.body.date).toDateString(),
                          duration: Number(req.body['duration']),
                          description: req.body['description']}
                          );
  }
  catch (err){
    console.log(err.message);
  }   
});

app.get("/api/users", async(req,res) => {
  try {
    let users = await User.find();
    res.send(users);
  }
  catch (err){
    console.log(err.message);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    let { from, to, limit } = req.query;
    let query = { idUser: req.params._id };
    
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    
    let exercisesQuery = Exercise.find(query);
    if (limit) exercisesQuery = exercisesQuery.limit(Number(limit));
    
    let exercises = await exercisesQuery;
    
    let arrayExercises = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    let userFound = await User.findById(req.params._id);

    res.json({
      _id: userFound.id,
      username: userFound.username,
      from: from ? new Date(from).toDateString() : undefined,
      to: to ? new Date(to).toDateString() : undefined,
      count: arrayExercises.length,
      log: arrayExercises
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
