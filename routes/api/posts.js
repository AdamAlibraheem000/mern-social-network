const express = require('express');
const router = express.Router();


// @route  GET api/posts
// @desc   TEST route
// @access  Public -- not token required
router.get('/', (req, res) => res.send("Posts route"));

module.exports = router;