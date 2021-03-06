const router = require('express').Router();
const passport = require('passport');

// express-validator
const { validationResult } = require('express-validator/check');
const { body } = require('express-validator/check');

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Models
const models = require('../models/schemas');


// When the app loads check if user is authenticated
router.get('/', (req, res) => {
    
    // If user is authenticated send back their data
    if(req.isAuthenticated()){

        const query = {
            username: req.user.username
        };

        // Find authenticated user
        models.Users.findOne(query)
        .then((data) => {

            const currentUser = {
                username: req.user.username,
                avatar: data.profile.avatar
            };

            res.json({isAuth: true, user: currentUser}); 
        })
        .catch((err) => {
            console.log(err);
        });
    }
    // A guest is visiting the site
    else{
        res.json({isAuth: false});
    }    
});

// User logging in
router.post('/login', passport.authenticate('local'), (req, res, next) => {

    const query = { username: req.user.username };
    const currentUser = {
        username: req.user.username,
    };

    // Query to get the user's avatar
    models.Users.findOne(query)
    .then(() => {
        res.json({actionSuccess: true, user: currentUser}); 
    })
    .catch((err) => {
        console.log(err);
    });
    
});

// User sign up 
router.post('/signup', [
    body('username') // Username validation
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long.')
    .trim()
    .isAlphanumeric()
    .withMessage('Username must have only letters or numbers and no spaces.')
    .custom( (value, {req} ) => {
    
        const username = new RegExp(`^${value}$`);

        return models.Users.findOne({username: {$regex: username, $options: 'i' }})
        .then((user) => {

            // Checking to see if this username already exists
            if(user){
                return Promise.reject(`The username "${req.body.username}" is already taken.`);
            }
        })
        .catch((err) => {
            throw new Error(err);            
        });
        
    }),
    body('password') // Password validation
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .matches(/\d/)
    .withMessage('Password must have at least one number.'),
    body('confirmPassword') // Password confirmation validation
    .custom( (value, { req } ) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password.');
        }
        else{
            return Promise.resolve(value);
        }
        
    })], (req, res, next) => {
        
    // Errors from the register account validation form  
    const validationErrors = validationResult(req);
    
    // Errors are found on the form
    if(!validationErrors.isEmpty()){  

        let mappedErrors = validationErrors.mapped();
        return res.status(422).json({ validationErrors: mappedErrors });
    }

    // Place the new user into the database
    

    // Information user filled out form with
    const user = {
        username: req.body.username,
        password: req.body.password
    };
    let createdUser;
    
    // Hash password and store into database
    bcrypt.hash(user.password, saltRounds)
    .then( (hash) => {
        
        user.password = hash;

        // Create new user with hashed password into Users Collection
        return models.Users.create(user);
    })
    .then((newUser) => {
    
        createdUser = newUser;

        // Create a 'feed' for the user - people that follow user's post will go here
        return models.Feed.create({username: createdUser.username});
    })
    .then(() => {

        // Create a new notification
        const notification = {
            action: 'WELCOME',
            viewed: false,
            comment: `Welcome to LookID, ${user.username}!`
        };

        return models.Users.update(
            { username: user.username }, 
            { $push: 
                { 
                    notifications: {
                        $each: [notification],
                        $position: 0
                    } 
                } 
            });
      
    })
    .then(() => {
        // Authenticate new user
        req.login(createdUser, (err) => {
            if (err) { 
                // return next(err); 
                Promise.reject(new Error('Had trouble logging you in. Please log in to verify that your account was created.'));
            }
            
            res.json({user: createdUser});
            
        });          
    })
    .catch((err) => {
        res.status(500).json({ error: err });
        console.log(err);
    });
          
    
});

router.get('/logout', (req, res) => {
    req.logout();
    res.json({actionSuccess: true, isAuth: false});
});








module.exports = router;