const Sequelize = require("sequelize");
const {models} = require ("../models");

const paginate = require('../helpers/paginate').paginate;

// Autoload el user asociado a :userId
exports.load = (req,res,next, userId) =>{
	
	models.user.findById(userId)
	.then(user => {
		if (user) {
		req.user = user;
		next();
	}else{
		req.flash('error', 'There is no user with id='+ userId);
		throw new Error('There is no user with id='+ userId);
	}
	})
	.catch(error => next(error));
	
};

// GET /users/:userId
exports.show = (req,res,next) => {
	
	const {user} = req;

	res.render('users/show', {user});
};

// GET /users
exports.index = (req,res,next) => {
	

	models.user.count()
	.then(count =>{
		const items_per_page = 10;

		const pageno = parseInt(req.query.pageno) || 1;

		res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

		const findOptions = {
			order: ['username'],
			offset: items_per_page * (pageno-1),
			limit: items_per_page
		};
		return models.user.findAll(findOptions);
	})
	.then(users=>{
		res.render('users/index.ejs', {users});
	})
	.catch(error=> next(error));

	
};

// GET /users/new
exports.new = (req,res,next) => {
	const user = {
		username: "",
		password: ""
	};
	res.render('users/new', {user});
};

// POST /users/create
exports.create = (req,res,next) => {
	
	const {username, password} = req.body;

	const user = models.user.build({
		username,
		password
	});

	user.save({fields: ["username", "password", "salt"]})
	.then(user => {
		req.flash('success','User created successfully.')
		res.redirect('/users/'+user.id)
	})
	.catch(Sequelize.UniqueConstraintError, error =>{
		req.flash('error', `User "${username}" already exists`);
		res.render('users/new', {user});
	})
	.catch(Sequelize.ValidationError, error =>{

		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error', message));
		res.render('users/new', {user});
	})
	.catch(error => {
		req.flash('error', 'Error creating a new User: '+ error.message);
		next(error)
	});
};

// GET /users/:userId/edit
exports.edit = (req,res,next) => {
	
	const {user} = req;
	res.render('users/edit', {user});
	
};

// PUT /users/:userId
exports.update = (req,res,next) => {
	
	const {user,body} = req;
	
	user.password= body.password;

	if(!body.password){
		req.flash('error', "Password field must be filled in");
		return res.render('users/edit', {user});
	}

	user.save({fields: ["password", "salt"]})
	.then(user => {
		req.flash('success', 'User updated successfully.');
		res.redirect('/users/'+user.id);
	})
	.catch(Sequelize.ValidationError, error =>{
		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error',message));
		res.render('users/edit', {user});
	})
	.catch(error => {
		req.flash('error','Error updating the user: '+ error.message);
		next(error)
	});
};

// DELETE /users/:userId
exports.destroy = (req,res,next) => {

	req.user.destroy()
	.then(()=> {
		req.flash('success', 'User deleted successfully');
		res.redirect('/users');
	})
	.catch(error=>{
		req.flash('error','Error deleting the user: '+ error.message);
		next(error)
	});
};