const axios = require('axios');
const logger = require('log4js').getLogger();

const MAGIC = Object.freeze({
  jpgNumber: 'ffd8ffe0',
  jpg2Number: 'ffd8ffe1',
  pngNumber: '89504e47',
  gifNumber: '47494638',
  jpgGeneral: 'ffd8ff',
  webm: '1f45dfa3',
  webp: '52494646',
});

const getBuffer = async (url) => {
  const { status, data } = await axios.get(url, { responseType: 'arraybuffer', validateStatus: () => true });
  if (status !== 200 || !data) {
    logger.error(`uri ${url} did not return status code 200 when seeking buffer.`);
    return undefined;
  }
  return Buffer.from(data);
};

const imageIdentifier = (buffer) => {
  const magicNumber = buffer.toString('hex', 0, 4);

  if (magicNumber === MAGIC.gifNumber) {
    return 'gif';
  }
  if (magicNumber.startsWith(MAGIC.jpgGeneral)) {
    return 'jpg';
  }
  if (magicNumber === MAGIC.pngNumber) {
    return 'png';
  }

  if (magicNumber === MAGIC.webm) {
    return 'webm';
  }

  if (magicNumber === MAGIC.webp) {
    return 'webp';
  }

  return '';
};

module.exports = {
  MAGIC,
  imageIdentifier,
  getBuffer,
};
