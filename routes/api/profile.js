const express = require('express');
const router = express.Router();


// @route  GET api/profile
// @desc   TEST route
// @access  Public -- not token required
router.get('/', (req, res) => res.send("Profile route"));

module.exports = router;