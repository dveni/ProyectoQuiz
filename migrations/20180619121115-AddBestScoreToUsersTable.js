'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
    'users',
    'bestScore',
    {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
      )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'bestScore');
  }
};
