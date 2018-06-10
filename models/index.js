const Sequelize = require('sequelize');

const sequelize = new Sequelize("sqlite:quiz.sqlite", {logging: false});

const path = require('path');

sequelize.import(path.join(__dirname, 'quiz'));

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