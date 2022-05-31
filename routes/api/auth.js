const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const config = require('config');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../../models/User')


// @route  GET api/auth
// @desc   TEST route
// @access  Public -- not token required

// adding 'auth' to any route will make it protected
router.get('/', auth, async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password'); //Does not return password
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  POST api/auth
// @desc   Authenticate user & get token
// @access  Public 
router.post('/', 
[
    
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is Required').exists()
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try{
    // See if user exists
    let user = await User.findOne({email: email});

    if(!user){
        // Check if user does not exist
       return res.status(400).json({errors: [{msg: "Invalid Credentials"}]});
    }

    // Compare passwords with user in database
    // Compare() takes in plain-text password & encrypted password
    const isMatch = await bcrypt.compare(password, user.password);

    // Check if not a match
    if(!isMatch){
        return res.status(400).json({errors: [{msg: "Invalid Credentials"}]});
    }



    // Return jsonwebtoken
    const payload = {
        user:{
            id: user.id
        }
    }

    jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000}, (err, token) => {
        if(err) throw err;
        res.json({token});
    })

    }catch(err){
        console.error(err.message);
        res.status(500).send("Server error");

    }

    
});

module.exports = router;