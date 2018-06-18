const Sequelize = require("sequelize");
const {models} = require ("../models");

// Autoload el quiz asociado a :quizId
exports.load = (req,res,next, quizId) =>{
	
	models.quiz.findById(quizId)
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

// GET /quizzes
exports.index = (req,res,next) => {
	models.quiz.findAll()
	.then(quizzes =>{
		res.render('quizzes/index.ejs', {quizzes});
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

	const quiz = models.quiz.build({
		question,
		answer
	});

	quiz.save({fields: ["question", "answer"]})
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
		res.redirect('/quizzes');
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

// GET /quizzes/randomPlay
exports.randomPlay = (req, res, next) => {
    req.session.randomPlay= req.session.randomPlay || [];
    req.session.score = req.session.score || 0;
    const score = req.session.score;
    const toBeAnswered = req.session.randomPlay;

    models.quiz.findOne({where: {id: {[Sequelize.Op.notIn] : toBeAnswered}} ,order: [Sequelize.fn('RANDOM')] })
    .then(quiz =>{
        if(quiz){
            req.session.randomPlay.push(quiz.id);
             res.render('quizzes/random_play', {
                quiz,
                score
            });
        }else{
           
            
            delete req.session.randomPlay;
            delete req.session.score;
            res.render('quizzes/random_nomore', {score});
        }
    })
    .catch(error => next(error));
};

// GET /quizzes/randomcheck/:quizId?answer=respuesta
exports.randomcheck = (req, res, next) => {

    let {quiz, query} = req;
    let score = req.session.score;
    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
   
    if (result){
        req.session.score++;
        score = req.session.score;

    }else{
        delete req.session.randomPlay;
        delete req.session.score;
    }

    res.render('quizzes/random_result', {
        score,
        result,
        answer
    });  
};

