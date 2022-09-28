const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
let cookieParser = require("cookie-parser");

const app = express();
mongoose.connect("mongodb://127.0.0.1:27017/quizApp");

app.use(bodyParser.json()); //to use json request body
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser());

const Question = {
  createdBy: { type: String },
  questionName: { type: String },
  questionCode: { type: String },
  numberOfQuestion: { type: Number },
  questions: {
    type: [
      {
        id: { type: String },
        question: { type: String },
        option: { type: Array },
        correctAns: { type: String },
      },
    ],
  },
};

const questionModel = mongoose.model("questions", Question);
app.post("/addQuestion", (req, res) => {
  console.log(req.body);
  const question1 = new questionModel({
    createdBy: req.body.createdBy,
    questionName: req.body.topic,
    numberOfQuestion: req.body.numberOfQuestion,
    questionCode: uuidv4(),
    questions: req.body.questions,
  });
  question1.save((err, result) => {
    if (err) {
      res.send("Something Went Wrong");
    } else {
      // alert("Data Sucessfully Saved")
      res.send("Data Save Successfully");
    }
  });
  console.log(req.body);
});

//api for fetch all question id
app.get("/fetchQuestionId", (req, res) => {
  if (req.cookies.user) {
    questionModel.find({}, (err, docs) => {
      if (err) {
        res.send("Something went wrong");
      } else {
        let result = [];
        for (let i = 0; i < docs.length; i++) {
          result.push({
            questionId: docs[i].questionCode,
            topic: docs[i].questionName,
          });
        }
        res.send(result);
      }
    });
  }
});

//fetch info by questionID
app.get("/fetchByQuestionId/:questionId", (req, res) => {
  if (req.cookies.user) {
    let questId = req.params.questionId;
    questionModel.find({ questionCode: questId }, (err, docs) => {
      if (err) {
        res.send("Something went Wrong");
      } else {
        let questions = [];
        for (let i = 0; i < docs[0].questions.length; i++) {
          questions.push({
            id: docs[0].questions[i].id,
            question: docs[0].questions[i].question,
            option: docs[0].questions[i].option,
          });
        }

        res.send(questions);
      }
    });
  }
});

app.get("/fetchAnswer/:questionId", (req, res) => {
  if (req.cookies.user) {
    let quesId = req.params.questionId;
    questionModel.find({ questionCode: quesId }, (err, docs) => {
      if (err) {
        res.send("Something Went Wrong");
      } else {
        let ansArray = [];
        console.log(docs[0].numberOfQuestion);
        for (let i = 0; i < docs[0].numberOfQuestion; i++) {
          ansArray.push(docs[0].questions[i].correctAns);
          console.log(docs[0].questions);
        }
        res.send(ansArray);
      }
    });
  }
});

app.get("/insertQuestion", (req, res) => {
  if (req.cookies.user) {
    res.sendFile(__dirname + "/views/question.html");
  } else {
    res.redirect("/ login");
  }
});

app.get("/quiz", (req, res) => {
  if (req.cookies.user) {
    console.log(req.params.questionId);
    res.sendFile(__dirname + "/views/quiz.html");
  }
});
app.get("/selectQuestionCode", (req, res) => {
  if (req.cookies.user) {
    res.sendFile(__dirname + "/views/questionSelector.html");
  }else{
      res.redirect('/login')
  }
});

app.listen(3000, () => {
  console.log("Server is running at port 3000");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/login", (req, res) => {
    if (req.cookies.user){
        res.redirect('/selectQuestionCode')
    }else{
        res.sendFile(__dirname + "/views/login.html");
    }
 
});

//sign Up code
const user = {
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  userToken: {
    type: String,
  },
};

const User = mongoose.model("users", user);

app.post("/register", (req, res) => {
  console.log(req.body);
  const user1 = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    userToken: uuidv4(),
  });

  user1.save((error, result) => {
    if (error) {
      res.send("Something went wrong");
    } else {
      res.send("Data saved sucessfully");
    }
  });

  // res.send("User Registered succesfully")
});

//login api
app.post("/validateUser", (req, res) => {
  if (req.cookies.user) {
    res.redirect("/selectQuestionCode");
  } else {
    console.log(req.body);

    User.find({ email: req.body.email }, (err, docs) => {
      if (err) {
        res.send("Something went wrong");
      } else {
        // console.log(docs[0].password)
        if (docs.length != 0 && docs[0].password == req.body.password) {
            let token = uuidv4()
          User.updateOne(
            { email: req.body.email },
            { userToken: token },
            (err, result) => {
              //generate  random token
              // save it in database
              // send this via cookie
              // validate this with database in restricted page
              console.log(docs)
              res.cookie("user", token); //sending to browser
              res.redirect("/selectQuestionCode");
            // res.send("Loggedimn")
            }
          );
        } else {
          res.send("Invalid Password");
        }
      }
    });
  }
});

app.get("/restrictedpage", (req, res) => {
  res.send("Your're Logged In As " + req.cookies.user);
});

app.get('/logout',(req,res)=>{
    res.clearCookie('user')
    res.redirect('/login')
})