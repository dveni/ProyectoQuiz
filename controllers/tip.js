const Sequelize = require("sequelize");
const {models} = require ("../models");

// Autoload el tip asociado a :tipId
exports.load = (req,res,next, tipId) =>{
	
	models.tip.findById(tipId)
	.then(tip => {
		if (tip) {
		req.tip = tip;
		next();
	}else{
		throw new Error('There is no tip with id='+ tipId);
	}
	})
	.catch(error => next(error));
	
};

// MW that allows actions only if the user logged in is admin or is the author of the quiz.
exports.adminOrAuthorRequired = (req, res, next) => {

    const isAdmin  = !!req.session.user.isAdmin;
    const isAuthor = req.quiz.authorId === req.session.user.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited operation: The logged in user is not the author of the quiz, nor an administrator.');
        res.send(403);
    }
};

// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req,res,next) =>{
	const {tip} = req;
	tip.accepted = true;

	tip.save(["accepted"])
	.then( tip =>{
		req.flash('success', 'Tip accepted successfully.');
		res.redirect('/quizzes/'+req.params.quizId);
	})
	.catch(error => {
		req.flash('error', 'Error accepting the tip: ' + error.message);
		next(error);
	});
};


// POST /quizzes/:quizId/tips
exports.create = (req,res,next) => {
	
	const authorId = req.session.user && req.session.user.id || 0;

	const tip = models.tip.build({
		text: req.body.text,
		quizId: req.quiz.id,
		authorId: authorId
	});

	tip.save()
	.then(tip => {
		req.flash('success','Tip created successfully.')
		res.redirect("back")
	})
	.catch(Sequelize.ValidationError, error =>{

		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error', message));
		res.render("back");
	})
	.catch(error => {
		req.flash('error', 'Error creating the new tip: '+ error.message);
		next(error)
	});
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req,res,next) => {

	req.tip.destroy()
	.then(()=> {
		req.flash('success', 'Tip deleted successfully');
		res.redirect('/quizzes/'+req.params.quizId);
	})
	.catch(error=>{
		req.flash('error','Error deleting the tip: '+ error.message);
		next(error)
	});
};

// GET /quizzes/:quizId/tip/:tipId/edit
exports.edit = (req, res, next) => {

    const {quiz, tip} = req;

    res.render('tips/edit', {quiz, tip});
};


// PUT /quizzes/:quizId/tip/:tipId
exports.update = (req, res, next) => {

    const {quiz, body, tip} = req;

    tip.text = body.text;
    tip.accepted = false;

    tip.save({fields: ["text", "accepted"]})
    .then(quiz => {
        req.flash('success', 'Tip edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};