const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')


// @route  POST api/posts
// @desc   Create a post
// @access  Private
router.post('/', [auth, [
    check('text', "Text is required").not().isEmpty()
]], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }


    try {

        // Get user minus password
    const user = await User.findById(req.user.id).select('-password');

    // New post object
    const newPost =  new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    })

    // Add to database
    const post = await newPost.save();

    res.json(post);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route  GET api/posts
// @desc   Get all posts
// @access  Private

router.get('/', auth, async (req, res) => {
    try {

        // date -1 to get most recent
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route  GET api/posts/:id
// @desc   Get post by ID
// @access  Private

router.get('/:id', auth, async (req, res) => {
    try {

        // date -1 to get most recent
        const post = await Post.findById(req.params.id);
        // Check if post exists with id
        if(!post){
            return res.status(404).json({msg: "Post not found"})
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            // Incorrect ID was entered. Not server error
            return res.status(404).json({msg: "Post not found"})
        }
        res.status(500).send("Server Error");
    }
});

// @route  DELETE api/posts/:id
// @desc   Delete post by id
// @access  Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if post exists
        if(!post){
            return res.status(404).json({msg: "Post not found"});
        }

        // Check that the user owns the post
        // post.user is an object while req.user.id is a string
        // change post.user into a string with toString()

        if(post.user.toString() !== req.user.id){
            return res.status(401).json({msg: "User not authorized"});
        }

        // Delete post from database
        await post.remove();

        res.json({msg: "Post removed"});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            // Incorrect ID was entered. Not server error
            return res.status(404).json({msg: "Post not found"})
        }
        res.status(500).send("Server Error");
    }
});

// @route  PUT api/posts/like/:id
// @desc   Like a post
// @access  Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        // likes- array. 
        // Compares current user to user logged in
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            return res.status(400).json({msg: "Post already liked"})
        }

        post.likes.unshift({user: req.user.id});

        // Save to database
        await post.save();

        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// @route  PUT api/posts/unlike/:id
// @desc   unlike a post
// @access  Private

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        // likes- array. 
        // Compares current user to user logged in
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            return res.status(400).json({msg: "Post has not yet been liked"})
        }

        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);


        post.likes.splice(removeIndex,1);

        // Save to database
        await post.save();

        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// @route  POST api/posts/comment/:id
// @desc   Comment on a post
// @access  Private
router.post('/comment/:id', [auth, [
    check('text', "Text is required").not().isEmpty()
]], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }


    try {

        // Get user minus password
    const user = await User.findById(req.user.id).select('-password');

    // Get post from database
    const post = await Post.findById(req.params.id);

    // New post object
    const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    };

    post.comments.unshift(newComment);

    // Add to database
    await post.save();
    

    res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route  DELELE api/posts/comment/:id/:comment_id
// @desc   Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        // Get post from database
    const post = await Post.findById(req.params.id);

    // Get comment from post
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Check to make sure comment exists
        if(!comment){
            return res.status(404).json({msg: 'Comment does not exist'})
        }

        // Check if user is the current user logged in
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg:"User not authorized"});
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

module.exports = router;