const Sequelize = require('sequelize');

// To use SQLite db:
// DATABASE_URL = sqlite:quiz.sqlite
// To use Heroku Postgres db:
// DATABASE_URL = postgres://user:passwd@host:port/database

const url = process.env.DATABASE_URL || "sqlite:quiz.sqlite";

const sequelize = new Sequelize(url);

const path = require('path');

sequelize.import(path.join(__dirname, 'quiz'));
sequelize.import(path.join(__dirname, 'session'));

sequelize.sync()
.then(()=> console.log('Data Bases created successfully'))
.then(() => sequelize.models.quiz.count())
.then(count=>{
  if(!count){
    return sequelize.models.quiz.bulkCreate([
        {question: "Capital de Italia", answer: "roma"},
        {question: "Capital de Francia", answer: "paris"},
        {question: "Capital de España", answer: "madrid"},
        {question: "Capital de Portugal", answer: "lisboa"}
      ]);
  }
})
.catch(error=>next(error));

module.exports =sequelize;