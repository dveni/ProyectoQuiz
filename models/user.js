const crypt = require('../helpers/crypt');

module.exports = function(sequelize, DataTypes){
	const User = sequelize.define('user',
	{
		username: {
			type: DataTypes.STRING,
			unique: true,
			validate: {notEmpty:{msg: "Username must not be empty"}}
		},
		password: {
			type: DataTypes.STRING,
			validate: {notEmpty:{msg: "Password must not be empty"}},
			set(password){
				//Random string used as salt
				this.salt = Math.round((new Date().valueOf()*Math.random()))+'';
				this.setDataValue('password', crypt.encryptPassword(password, this.salt));
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		isAdmin:{
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		bestScore: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		}
		
	});

	User.prototype.verifyPassword = function (password) {
        return crypt.encryptPassword(password, this.salt) === this.password;
    };

    return User;
};