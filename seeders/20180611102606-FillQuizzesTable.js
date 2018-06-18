'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */

    return queryInterface.bulkInsert('quizzes', [
    {
      question: 'Capital of Italy',
      answer: 'Rome',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      question: 'Capital of Portugal',
      answer: 'Lisbon',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      question: 'Capital of Spain',
      answer: 'Madrid',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      question: 'Capital of France',
      answer: 'Paris',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('quizzes', null, {});
  }
};
