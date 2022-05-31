const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const {check, validationResult} = require('express-validator')

const User = require('../../models/User')

// @route  POST api/users
// @desc   Register user
// @access  Public -- not token required
router.post('/', 
[
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with six or more characters').isLength({min: 6})
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;

    try{
    // See if user exists
    let user = await User.findOne({email: email});

    if(user){
        // if user exists, send 400 error
       return res.status(400).json({errors: [{msg: "User already exists"}]});
    }

    // Get user's gravatar
    const avatar = gravatar.url(email, {
        s:'200',
        r:'pg',
        d:'mm'
    })

    user = new User({
        name,
        email,
        avatar,
        password
    });

    // Encrypt password

    // Add 10 rounds of salt
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    // save to database
    await user.save();

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