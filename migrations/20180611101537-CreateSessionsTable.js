'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    return queryInterface.createTable(
      'sessions',
        {
          sid:{
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
            unique: true
          },
          expires:{
            type: Sequelize.DATE
          },
          data:{
            type: Sequelize.STRING(50000)
            },
          createdAt:{
            type: Sequelize.DATE,
            allowNull:false
          },
          updatedAt:{
            type: Sequelize.DATE,
            allowNull: false
          }
        },
        {
          sync: {force:true}
        }
      );
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:*/
      return queryInterface.dropTable('sessions');
    
  }
};
