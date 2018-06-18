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
sequelize.import(path.join(__dirname, 'tip'));
sequelize.import(path.join(__dirname, 'user'));
sequelize.import(path.join(__dirname, 'attachment'));


// Relation between models

const {quiz, tip, user, attachment} = sequelize.models;

tip.belongsTo(quiz);
quiz.hasMany(tip);

user.hasMany(quiz, {foreignKey: 'authorId'});
quiz.belongsTo(user, {as: 'author',foreignKey: 'authorId'});

attachment.belongsTo(quiz);
quiz.hasOne(attachment);

quiz.belongsToMany(user, {as:'fans', through: 'favourites', foreignKey: 'quizId', otherKey: 'userId'});
user.belongsToMany(quiz, {as:'favouriteQuizzes', through: 'favourites', foreignKey: 'userId', otherKey: 'quizId'});

// Relation 1-to-N between User and Tip:
user.hasMany(tip, {foreignKey: 'authorId'});
tip.belongsTo(user, {as: 'author', foreignKey: 'authorId'});

module.exports =sequelize;