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
      'tips',
        {
          id:{
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
          },
          quizId:{
            type: Sequelize.INTEGER
          },
          text:{
            type: Sequelize.STRING,
            validate: {notEmpty: {msg:"Tip must not be empty"}}
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
      return queryInterface.dropTable('tips');
    
  }
};
