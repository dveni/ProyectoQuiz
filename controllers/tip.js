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
	

	const tip = models.tip.build({
		text: req.body.text,
		quizId: req.quiz.id
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