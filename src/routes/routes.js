const router = require('express-promise-router')();

const images = require('./characters/images');
const characters = require('./characters/characters');
const series = require('./series');
const votes = require('./votes');

router.use('/images', images);
router.use('/characters', characters);
router.use('/series', series);
router.use('/votes', votes);

module.exports = router;
