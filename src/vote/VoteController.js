const express = require('express');

const router = express.Router();
const votesHelper = require('./VoteHelper');

// post stats
router.route('/')
  .post(votesHelper.postVote);

module.exports = router;
