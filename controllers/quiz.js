const Sequelize = require("sequelize");
const {models} = require ("../models");

const paginate = require('../helpers/paginate').paginate;

const cloudinary = require('cloudinary');
const fs = require('fs');
const attHelper = require('../helpers/attachments');

const cloudinary_upload_option = {
	async: true,
	folder: "/daveni-quiz/attachments",
	resource_type: "auto",
	tags: ['core', 'quiz']
};

// Autoload el quiz asociado a :quizId
exports.load = (req,res,next, quizId) =>{
	
const options = {
        include: [
            models.tip,
            models.attachment,
            {model: models.user, as: 'author'}
        ]
    };

    // For logged in users: include the favourites of the question by filtering by
    // the logged in user with an OUTER JOIN.
    if (req.session.user) {
        options.include.push({
            model: models.user,
            as: "fans",
            where: {id: req.session.user.id},
            required: false  // OUTER JOIN
        });
    }

    models.quiz.findById(quizId, options)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
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
exports.index = (req, res, next) => {

    let countOptions = {
        where: {},
        include: []
    };

    const searchfavourites = req.query.searchfavourites || "";

    let title = "Questions";

    // Search:
    const search = req.query.search || '';
    if (search) {
        const search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where.question = { [Op.like]: search_like };
    }

    // If there exists "req.user", then only the quizzes of that user are shown
    if (req.user) {
        countOptions.where.authorId = req.user.id;

        if (req.session.user && req.session.user.id == req.user.id) {
            title = "My Questions";
        } else {
            title = "Questions of " + req.user.username;
        }
    }

    // Filter: my favourite quizzes:
    if (req.session.user) {
        if (searchfavourites) {
            countOptions.include.push({
                model: models.user,
                as: "fans",
                where: {id: req.session.user.id},
                attributes: ['id']

            });
        } else {

            // NOTE:
            // It should be added the options ( or similars )
            // to have a lighter query:
            //    where: {id: req.session.user.id},
            //    required: false  // OUTER JOIN
            // but this does not work with SQLite. The generated
            // query fails when there are several fans of the same quiz.

            countOptions.include.push({
                model: models.user,
                as: "fans",
                attributes: ['id']
            });
        }
    }

    models.quiz.count(countOptions)
    .then(count => {

        // Pagination:

        const items_per_page = 10;

        // The page to show is given in the query
        const pageno = parseInt(req.query.pageno) || 1;

        // Create a String with the HTMl used to render the pagination buttons.
        // This String is added to a local variable of res, which is used into the application layout file.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        const findOptions = {
            ...countOptions,
            offset: items_per_page * (pageno - 1),
            limit: items_per_page
        };

        findOptions.include.push(models.attachment);
        findOptions.include.push({
            model: models.user,
            as: 'author'
        });

        return models.quiz.findAll(findOptions);
    })
    .then(quizzes => {

        const format = (req.params.format || 'html').toLowerCase();

        switch (format) {
            case 'html':

                // Mark favourite quizzes:
                if (req.session.user) {
                    quizzes.forEach(quiz => {
                        quiz.favourite = quiz.fans.some(fan => {
                            return fan.id == req.session.user.id;
                        });
                    });
                }

                res.render('quizzes/index.ejs', {
                    quizzes,
                    search,
                    searchfavourites,
                    cloudinary,
                    title
                });
                break;

            case 'json':
                res.json(quizzes);
                break;

            default:
                console.log('No supported format \".'+format+'\".');
                res.sendStatus(406);
        }
    })
    .catch(error => next(error));
};

// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    const format = (req.params.format || 'html').toLowerCase();

    switch (format) {
        case 'html':

            new Promise((resolve, reject) => {

                // Only for logger users:
                //   if this quiz is one of my fovourites, then I create
                //   the attribute "favourite = true"
                if (req.session.user) {
                    resolve(
                        req.quiz.getFans({where: {id: req.session.user.id}})
                        .then(fans => {
                            if (fans.length > 0) {
                                req.quiz.favourite = true;
                            }
                        })
                    );
                } else {
                    resolve();
                }
            })
            .then(() => {
                res.render('quizzes/show', {
                    quiz,
                    cloudinary
                });
            })
            .catch(error => next(error));

            break;

        case 'json':
            res.json(quiz);
            break;

        default:
            console.log('No supported format \".'+format+'\".');
            res.sendStatus(406);
    }
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
		
		if(!req.file){
			req.flash('info', 'Quiz without attachment');
			res.redirect('/quizzes/'+quiz.id);
			return;
			
		}
		// Save the attachment into Cloudinary
		return attHelper.checksCloudinaryEnv()
		.then( ()=>{
			return attHelper.uploadResourceToCloudinary(req.file.path, cloudinary_upload_option);
		})
		.then(uploadResult =>{

			// Create the new attachment into the database
			return models.attachment.create({
				public_id: uploadResult.public_id,
				url: uploadResult.url,
				filename: req.file.originalname,
				mime: req.file.mimetype,
				quizId: quiz.id })
			.then(attachment =>{
				req.flash('success', 'Image saved succesfully');
			})
			.catch(error =>{
				req.flash('error', 'Failed to save the file: '+error.message);
				cloudinary.api.delete_resources(uploadResult.public_id);
			});
		})
		.catch(error =>{
			req.flash('error', 'Failed to save attachment: '+ error.message);
		})
		.then(()=>{
			fs.unlink(req.file.path); //delete the file uploaded at ./uploads
			res.redirect('/quizzes/' + quiz.id);
		});
	})
	.catch(Sequelize.ValidationError, error =>{

		req.flash('error','There are errors in the form:');
		error.errors.forEach(({message}) => req.flash('error',  message));
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

		if(!body.keepAttachment){
			// There is no attachment: Delete old attachment
			if(!req.file){
				req.flash('info', 'This quiz has no attachment');
				if(quiz.attachment){
					cloudinary.api.delete_resources(quiz.attachment.public_id);
					quiz.attachment.destroy();
				}
				return;
			}

			// Save the new attachment into Cloudinary

			return attHelper.checksCloudinaryEnv()
			.then(()=>{
				return attHelper.uploadResourceToCloudinary(req.file.path, cloudinary_upload_option);
			})
			.then(uploadResult => {
				//Remember the public id of the old image
				const old_public_id = quiz.attachment ? quiz.attachment.public_id : null;

				// Update the attachment into the db
				return quiz.getAttachment()
				.then(attachment =>{
					if(!attachment){
						attachment = models.attachment.build({quizId: quiz.id});
					}
					attachment.public_id = uploadResult.public_id;
					attachment.url = uploadResult.url;
					attachment.filename = req.file.originalname;
					attachment.mime = req.file.mimetype;
					return attachment.save();
				})
				.then(attachment =>{
					req.flash('success', 'Image saved succesfully');
					if(old_public_id){
						cloudinary.api.delete_resources(old_public_id);
					}
				})
				.catch(error =>{
					req.flash('error', 'Failed saving new image: '+ error.message);
					cloudinary.api.delete_resources(uploadResult.public_id);
				});
			})
			.catch(error =>{
				req.flash('error', 'Failed saving the new attachment: '+ error.message);
			})
			.then(()=>{
				fs.unlink(req.file.path);
			});

		}

		
	})
	.then(()=>{
		res.redirect('/quizzes/'+ req.quiz.id);
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

	if(req.quiz.attachment){
		attHelper.checksCloudinaryEnv()
		.then(()=>{
			cloudinary.api.delete_resources(req.quiz.attachment.public_id);
		})
	}

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
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    new Promise(function (resolve, reject) {

        // Only for logger users:
        //   if this quiz is one of my fovourites, then I create
        //   the attribute "favourite = true"
        if (req.session.user) {
            resolve(
                req.quiz.getFans({where: {id: req.session.user.id}})
                .then(fans => {
                    if (fans.length > 0) {
                        req.quiz.favourite = true
                    }
                })
            );
        } else {
            resolve();
        }
    })
    .then(() => {
        res.render('quizzes/play', {
            quiz,
            answer,
            cloudinary
        });
    })
    .catch(error => next(error));
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

