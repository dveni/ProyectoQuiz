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

// Relation between models

const {quiz, tip, user} = sequelize.models;

tip.belongsTo(quiz);
quiz.hasMany(tip);

user.hasMany(quiz, {foreignKey: 'authorId'});
quiz.belongsTo(user, {as: 'author',foreignKey: 'authorId'})

module.exports =sequelize;