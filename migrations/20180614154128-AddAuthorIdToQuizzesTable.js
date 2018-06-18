'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'quizzes',
      'authorId',
      {type: Sequelize.INTEGER}
      );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('quizzes', 'authorId');
  }
};
