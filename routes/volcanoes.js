const express = require('express');
const authorize = require('../helpers/auth');
const router = express.Router();
const auth = require('../helpers/auth');

const validPopulatedWithin = [
    '5km',
    '10km', 
    '30km',
    '100km'
]


// Get all volcanoes from a particular country
router.get('/volcanoes', function(req, res) { 

    // TODO: Check if keys contains invalid params

    // Retreive query params
    const country = req.query.country;
    const populatedWithin = req.query.populatedWithin;

    // Check for country query
    if (!country) { 
        res.status(400).json({
            error: true,
            message: `Country is a required query parameter.`
        }); 
        return; 
    }

    // Check for valid populatedWithin value
    if (populatedWithin && !validPopulatedWithin.includes(populatedWithin)) { 
        res.status(400).json({
            error: true,
            message: `Invalid value for populatedWithin: ${populatedWithin}. Only ${validPopulatedWithin.join(',')} are permitted.`
        }); 
        return; 
    }

    // Check if there are any other invalid params
    for (const item of Object.keys(req.query)) { 
        if (item !== 'country' && item !== 'populatedWithin') { 
            res.status(400).json({
                error: true,
                message: `Invalid query parameters. Only country and populatedWithin are permitted.`
            }); 
            return;
        }
    }

    // Retrieve from db
    req.db.from('volcanoes').select('id', 'name', 'country', 'region', 'subregion').where({ country: country }).andWhere(function() { 
        if (populatedWithin) { this.where(`population_${populatedWithin}`, '>', 0); }
    })
    .then((rows) => {
        // Return result
        res.status(200).json(rows)
    })
    .catch((err) => { 
        console.log(err);
        res.status(500).json({
            error: true, 
            message: 'An interal server error occurred.'
        })
    })
});


// Get a particular volcano's information
router.get('/volcano/:id', authorize, function(req, res) { 

    // Check for parameters
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
        res.status(400).json({
            error: true,
            message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
        }); 
        return; 
    }

    // Seperate params
    const volcanoID = req.params.id;

    // Select columns
    const selectColumns = ['id', 'name', 'country', 'region', 'subregion', 'last_eruption', 'summit', 'elevation', 'latitude', 'longitude'];
    if (req.isAuthenticated) {  // Add more columns if authenticated
        Array.prototype.push.apply(selectColumns, [ 'population_5km', 'population_10km', 'population_30km', 'population_100km']);
    }

    // Retrieve from db
    req.db.from('volcanoes').first(selectColumns).where({ id: volcanoID })
    .then((row) => {

        // Check for a null response
        if (!row) { res.status(404).json({
            error: true,
            message: `Volcano with ID: ${req.params.id} not found.`
        }); return; }

        // Return result
        res.status(200).json(row)
    })
    .catch((err) => { 
        console.log(err);
        res.status(500).json({
            error: true, 
            message: 'An interal server error occurred.'
        })
    })
});


// EXPORT MODULE
module.exports = router;