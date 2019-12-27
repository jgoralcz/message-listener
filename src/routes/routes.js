const router = require('express-promise-router')();

const votes = require('./votes');
const images = require('./characters/images');
const characters = require('./characters/characters');
const series = require('./series');

router.use('/votes', votes);
router.use('/images', images);
router.use('/characters', characters);
router.use('/series', series);

module.exports = router;
