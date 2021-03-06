const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const {check, validationResult} = require('express-validator');
const request = require('request');
const config = require('config')

const Profile = require('../../models/Profile')
const User = require('../../models/User');


// @route  GET api/profile/me
// @desc   Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({user: req.user.id}).populate("user", ['name', 'avatar']);

        // Check if profile exists
        if(!profile){
            return res.status(400).json({msg: "There is no profile for this user"})
        }

        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route  POST api/profile
// @desc   Create or update user profile
// @access  Private
router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

    //   Pull all fields out
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;


// Build Profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    // Check if fields exists
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status)profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social ={};
    // Check if fields exists
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;

    

    try{
        // Search for profile by user
        let profile = await Profile.findOne({user: req.user.id});

        if(profile){
            // Update profile if it exists
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id}, 
                {$set: profileFields}, 
                {new: true}
                );

                return res.json(profile);
        }

        // If profile is not found, create new profile
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);


    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    }
    );

// @route  GET api/profile
// @desc   Get all profiles
// @access  Public

router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
})

// @route  GET api/profile/user/:user_id
// @desc   Get  profile by user ID
// @access  Public

router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name','avatar']);

        // Check if profile exists
        if(!profile) return res.status(400).json({msg: "Profile not found"});

        res.json(profile);
    } catch (err) {
        console.error(err.message);

        // fixes server error when searching for profile id that is not valid
        if(err.kind === "ObjectId"){
            return res.status(400).json({msg: "Profile not found"});
        }

        res.status(500).send('Server error')
    }
})

// @route  DELETE api/profile
// @desc   DELETE profile, user & posts
// @access  Private

// auth middleware required for accessing token
router.delete('/', auth, async (req,res) => {
    try {
        // @todo -remove user's posts
        // Remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        // Remove user
        await User.findOneAndRemove({_id: req.user.id});
        
        res.json({msg: "User removed"});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
})

// @route  PUT api/profile/experience
// @desc   Add profile experience
// @access  Private

router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
        // check for errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        // Get data from the body
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            // fetch profile to add experience to
            const profile = await Profile.findOne({user: req.user.id});

            // unshift(): pushes elements on to the beginning of array
            profile.experience.unshift(newExp);

            // Add to database
            await profile.save();

            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
})

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        // Get profile by user id
        const profile = await Profile.findOne({user: req.user.id});

        // Get the remove index
        const removeIndex = profile.experience.map(item => item.id)
        .indexOf(req.params.exp_id);

        // splicing out index
        profile.experience.splice(removeIndex, 1);

        // Updating database
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route  PUT api/profile/education
// @desc   Add profile education
// @access  Private

router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
        // check for errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        // Get data from the body
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            // fetch profile to add experience to
            const profile = await Profile.findOne({user: req.user.id});

            // unshift(): pushes elements on to the beginning of array
            profile.education.unshift(newEdu);

            // Add to database
            await profile.save();

            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
})

// @route  DELETE api/profile/education/:edu_id
// @desc   Delete education from profile
// @access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        // Get profile by user id
        const profile = await Profile.findOne({user: req.user.id});

        // Get the remove index
        const removeIndex = profile.education.map(item => item.id)
        .indexOf(req.params.edu_id);

        // splicing out index
        profile.education.splice(removeIndex, 1);

        // Updating database
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

// @route  GET api/profile/github/:username
// @desc   Get user repos from Github
// @access  Public

router.get('/github/:username', (req, res) =>{
    try {
        const options ={
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created: asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': "node.js"}
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);

            // Check if status code is not 200
            if(response.statusCode !== 200){
               return res.status(404).json({msg: 'No Github profile found'})
            }

            res.json(JSON.parse(body));


        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})


module.exports = router;