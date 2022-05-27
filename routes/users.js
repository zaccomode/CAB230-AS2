const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const authorize = require('../helpers/auth');
const router = express.Router();


function IsValidDate(pText) {
    var isValid = false ;
    var t = pText.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);

    if (t !== null) {
        var y = +t[1], m = +t[2], d = +t[3];
        var date = new Date(y, m - 1, d);

        isValid = (date.getFullYear() === y && date.getMonth() === m - 1) ;
    }

    return isValid;
}


// Register a new user
router.post('/register', function(req, res) {

    // Retrieve values from req body
    const email = req.body.email;
    const password = req.body.password;

    // Verify values
    if (!email || !password) { 
        res.status(400).json({
            error: true,
            message: 'Request body incomplete, both email and password are required'
        });
        return; 
    }

    // Check if that email is already used
    req.db.from('users').select('*').where({ email: email })
    .then((users) => { 
        if (users.length > 0) { 
            res.status(409).json({
                error: true,
                message: 'User already exists'
            });
            return;
        }

        // Insert user into DB
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        req.db.from('users').insert({ email: email, password_hash: hash })
        .then(() => { 
            res.status(201).json({ message: 'User created' });
        });
    });
});


// Login a user, returning a JWT
router.post('/login', function(req, res) { 

    // Retrieve values from req body
    const email = req.body.email;
    const password = req.body.password;

    // Verify values
    if (!email || !password) { 
        res.status(400).json({
            error: true,
            message: 'Request body incomplete, both email and password are required'
        });
        return; 
    }

    // Check if the user exists
    req.db.from('users').select('*').where({ email: email })
    .then((users) => { 
        if (users.length === 0) { return; }

        // Compare password hashes
        const user = users[0];
        return bcrypt.compare(password, user.password_hash);
    }).then((match) => {
        if (!match) {
            res.status(401).json({
                error: true,
                message: 'Incorrect email or password'
            });
            return;
        }

        // Create & return JWT
        const expiresIn = 60 * 60 * 24      // 1 day
        const exp = Date.now() + expiresIn * 1000;
        const token = jwt.sign({ email, exp }, process.env.SECRET_KEY);
        res.status(200).json({ 
            token: token, 
            token_type: 'Bearer',
            expires_in: expiresIn
        });
    });
});


// Return a user's profile
router.get('/:email/profile', authorize, function(req, res) { 

    // Retrieve values
    const email = req.params.email;

    // Find the user
    req.db.from('users').first('*').where({ email: email })
    .then((user) => {
        // Check if the user exists
        if (!user) { 
            res.status(404).json({
                error: true,
                message: 'User not found'
            }); 
            return;
        }

        // Assemble the user object from the DB
        let userInfo = {
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        }

        // Check if the JWT is associated with the email
        if (req.token) { 
            const jwtCheck = jwt.verify(req.token, process.env.SECRET_KEY);

            // Add more values for authenticated requests
            if (req.isAuthenticated && jwtCheck.email === email) { 
                userInfo.dob = user.dob;
                userInfo.address = user.address;
            }
        }

        res.status(200).json(userInfo);
    });
});


// Update a user's profile
router.put('/:email/profile', authorize, function(req, res) { 

    // Check if authenticated
    if (!req.isAuthenticated) { 
        res.status(401).send({
            error: true,
            message: `Authorization header ('Bearer token') not found`
        });
        return;
    }

    // Get values
    const email = req.params.email;
    const userInfo = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        dob: req.body.dob,
        address: req.body.address
    }

    // Check values
    if (!userInfo.first_name || !userInfo.last_name || !userInfo.dob || !userInfo.address) { 
        res.status(400).json({
            error: true,
            message: 'Request body incomplete: firstName, lastName, dob and address are required.'
        });
        return; 
    }

    // Check if names & address are strings
    if (typeof userInfo.first_name !== 'string' || typeof userInfo.last_name !== 'string' || typeof userInfo.address !== 'string') { 
        res.status(400).json({
            error: true,
            message: 'Request body invalid: firstName, lastName and address must be strings only.'
        });
        return;
    }

    // Validate dob string
    if (!IsValidDate(userInfo.dob.replaceAll('-', '/'))) {
        res.status(400).json({
            error: true,
            message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.'
        });
        return;
    }

    const dobDate = new Date(userInfo.dob)

    // Check if date is in the past
    if (dobDate > Date.now()) {
        res.status(400).json({
            error: true,
            message: 'Invalid input: dob must be a date in the past.'
        });
        return;
    }

    // Check if the JWT is associated with the email
    const jwtCheck = jwt.verify(req.token, process.env.SECRET_KEY);
    if (jwtCheck.email !== email) {
        res.status(403).json({
            error: true,
            message: 'Forbidden'
        });
        return;
    }

    // Update DB
    req.db.from('users').update(userInfo).where({ email: email })
    .then(() => {
        return req.db.from('users').first('*').where({ email: email })
    })
    .then((user) => { 

        // Return an updated user object
        res.status(200).json({
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            dob: user.dob,
            address: user.address
        });
    })
});


// EXPORT MODULE
module.exports = router;