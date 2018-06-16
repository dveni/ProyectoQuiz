const Sequelize = require("sequelize");
const {models} = require ("../models");

const paginate = require('../helpers/paginate').paginate;

// Autoload el quiz asociado a :quizId
exports.load = (req,res,next, quizId) =>{
	
	models.quiz.findById(quizId, {
		include: [
		models.tip,
		{model: models.user, as:'author'} ]
	})
	.then(quiz => {
		if (quiz) {
		req.quiz = quiz;
		next();
	}else{
		throw new Error('There is no quiz with id='+ quizId);
	}
	})
	.catch(error => next(error));
	
};

exports.adminOrAuthorRequired = (req,res,next) =>{
	const isAdmin = !!req.session.user.isAdmin;
	const isAuthor = req.quiz.authorId === req.session.user.id;

	if(isAdmin || isAuthor){
		next();
	}else{
		console.log('Prohibited operation: Only admins and author of the quiz');
		res.send(403);
	}

};

// GET /quizzes
exports.index = (req,res,next) => {
	
	let countOptions = { where: {}};
	let title = "Questions";

	const search = req.query.search || '';
	if(search){
		const  search_like = "%" +search.replace(/ +/g, "%") + "%";
		countOptions.where = {question:{ [Sequelize.Op.like]: search_like }};
	}

	if(req.user){
		countOptions.where.authorId = req.user.id;
		title = "Questions of " + req.user.username;
	}

	models.quiz.count(countOptions)
	.then(count =>{
		const items_per_page = 10;

		const pageno = parseInt(req.query.pageno) || 1;

		res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

		const findOptions = {
			...countOptions,
			offset: items_per_page * (pageno-1),
			limit: items_per_page,
			include: [{model: models.user, as:'author'}]
		};
		return models.quiz.findAll(findOptions);
	})
	.then(quizzes=>{
		res.render('quizzes/index.ejs', {quizzes, search, title});
	})
	.catch(error=> next(error));

	
};

// GET /quizzes/:quizId
exports.show = (req,res,next) => {
	
	const {quiz} = req;

	res.render('quizzes/show', {quiz});
};

// GET /quizzes/new
exports.new = (req,res,next) => {
	const quiz = {
		question: "",
		answer: ""
	};
	res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req,res,next) => {
	
	const {question, answer} = req.body;

	const authorId = req.session.user && req.session.user.id || 0;

	const quiz = models.quiz.build({
		question,
		answer,
		authorId
	});

	quiz.save({fields: ["question", "answer", "authorId"]})
	.then(quiz => {
		req.flash('success','Quiz created successfully.')
		res.redirect('/quizzes/'+quiz.id)
	})
	.catch(Sequelize.ValidationError, error =>{

		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error', message));
		res.render('quizzes/new', {quiz});
	})
	.catch(error => {
		req.flash('error', 'Error creating a new Quiz: '+ error.message);
		next(error)
	});
};

	

// GET /quizzes/:quizId/edit
exports.edit = (req,res,next) => {
	
	const {quiz} = req;
	res.render('quizzes/edit', {quiz});
	
};

// PUT /quizzes/:quizId
exports.update = (req,res,next) => {
	
	const {quiz,body} = req;
	
	quiz.question = body.question;
	quiz.answer = body.answer;

	quiz.save({fields: ["question", "answer"]})
	.then(quiz => {
		req.flash('success', 'Quiz edited successfully.');
		res.redirect('/quizzes/'+quiz.id);
	})
	.catch(Sequelize.ValidationError, error =>{
		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error',message));
		res.render('quizzes/edit', {quiz});
	})
	.catch(error => {
		req.flash('error','Error editing the Quiz: '+ error.message);
		next(error)
	});
};

// DELETE /quizzes/:quizId
exports.destroy = (req,res,next) => {

	req.quiz.destroy()
	.then(()=> {
		req.flash('success', 'Quiz deleted successfully');
		res.redirect('/goback');
	})
	.catch(error=>{
		req.flash('error','Error deleting the Quiz: '+ error.message);
		next(error)
	});
};

// GET /quizzes/:quizId/play
exports.play = (req,res,next) => {
	
	const {quiz, query} = req;
	const answer = query.answer || '';

	res.render('quizzes/play',{
		quiz,
		answer
	});
	
};

// GET /quizzes/:quizId/check
exports.check = (req,res,next) => {
	
	const {quiz,query} = req;
	const answer = req.query.answer || "";

	const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

	res.render('quizzes/result',{
		quiz,
		result,
		answer
		});

};

