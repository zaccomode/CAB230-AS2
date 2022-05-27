const express = require('express');
const router = express.Router();


// Get all countries, ordered alphabetically
router.get('/', function(req, res) { 

    // Check for parameters
    const queryParams = Object.keys(req.query);
    if (queryParams.length > 0) {
        res.status(400).json({
            error: true,
            message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
        }); 
        return; 
    }

    // Retrieve from db
    req.db.from('volcanoes').distinct('country').whereNotNull('country').orderBy('country')
    .then((rows) => {
        // Map to remove the JSON surrounds
        const countries = rows.map((row) => row.country)

        // Return mapped array
        res.status(200).json(countries)
    })
    .catch((err) => { 
        console.log(err);
        res.status(500).json({
            error: true, 
            message: 'An interal server error occurred.'
        });
    })
});


// EXPORT MODULE
module.exports = router;