const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(cors());

const knexOptions = require('./knexfile.js');
const knex = require('knex')(knexOptions);



// Routers
const countryRouter = require('./routes/countries');
const volcanoRouter = require('./routes/volcanoes');
const userRouter = require('./routes/users');
const swaggerRouter = require('./routes/swagger');


// MIDDLEWARE
app.use((req, res, next) => {
    req.db = knex;
    
    next();
});



// LOGGER MIDDLEWARE
logger.token('req', (req, res) => JSON.stringify(req.headers));
logger.token('res', (req, res) => { 
    const headers = {};
    res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
    return JSON.stringify(headers);
});


// ADMIN /ME ENDPOINT
app.get('/me', function(req, res) {
    res.status(200).json({
        name: 'Isaac Shea',
        student_number: 'n11043954'
    });
});


// ADD ROUTES
app.use('/', volcanoRouter);
app.use('/countries', countryRouter);
app.use('/user', userRouter);
app.use('/', swaggerRouter);


// 404 RESPONSE MIDDLEWARE
app.use((req, res, next) => {
    res.status(404).json({
        error: true,
        message: 'Page not found!'
    });
});
    

// RUN SERVER
const port = process.env.PORT || 4242;
app.listen(port, () => console.log('Running on port', port));