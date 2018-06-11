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
      'users',
        {
          id:{
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
          },
          username:{
            type: Sequelize.STRING,
            unique: true,
            validate: {notEmpty: {msg: "Username must not be empty"}}
          },
          password:{
            type: Sequelize.STRING,
            validate: {notEmpty: {msg:"Password must not be empty"}}
          },
          salt:{
            type: Sequelize.STRING
          },
          isAdmin:{
            type: Sequelize.BOOLEAN
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
      return queryInterface.dropTable('users');
    
  }
};
