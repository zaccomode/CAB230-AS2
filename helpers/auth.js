const jwt = require('jsonwebtoken');

/** Middleware to authenticate an endpoint */
const authorize = (req, res, next) => { 
    const auth = req.headers.authorization;
    let token = null;

    // Retrieve token
    if (auth && auth.split(' ').length === 2) {
        token = auth.split(' ')[1];
        console.log('Token:', token);
    } else if (auth) { 
        console.log('Malformed auth header');
        res.status(401).json({ error: true, message: 'Authorization header is malformed' });
        return;

    } else {
        // Return with a false isAuthenticated value
        req.isAuthenticated = false;
        next();
        return;
    }

    // Verify JWT & check expiration date
    try { 
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded) { 
            console.log('Malformed auth header');
            res.status(401).json({ error: true, message: 'Authorization header is malformed' });
            return;
        }

        if (decoded.exp < Date.now()) { 
            console.log('Token has expired');
            res.status(401).json({ error: true, message: 'JWT token has expired' });
            return;
        }

        // Advance
        req.isAuthenticated = true;
        req.token = token;
        next();
    } catch (err) { 
        console.log('Token is not valid:', err);
        res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
}


// EXPORT
module.exports = authorize