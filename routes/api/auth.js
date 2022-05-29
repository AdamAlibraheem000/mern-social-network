const express = require('express');
const router = express.Router();


// @route  GET api/auth
// @desc   TEST route
// @access  Public -- not token required
router.get('/', (req, res) => res.send("Auth route"));

module.exports = router;