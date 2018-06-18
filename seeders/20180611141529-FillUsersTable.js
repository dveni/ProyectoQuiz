'use strict';

var crypt = require('../helpers/crypt');

module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [
    {
      username: 'admin',
      password: crypt.encryptPassword('danieselmejor', 'aaaa'),
      salt: 'aaaa',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'pepe',
      password: crypt.encryptPassword('5678', 'bbbb'),
      salt: 'bbbb',
      createdAt: new Date(),
      updatedAt: new Date()
    }
      ]);
  },

  down(queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:*/
      return queryInterface.bulkDelete('users', null, {});
    
  }
};
