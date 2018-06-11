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



module.exports =sequelize;