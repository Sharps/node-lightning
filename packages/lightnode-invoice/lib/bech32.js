const bech32 = require('bech32');

module.exports = {
  decode,
  encode,
  convertWords,
  sizeofNum,
  sizeofBits,
};

/**
 * Decodes a bech32 encoded invoice into prefix and words
 * @param {String} invoice
 * @returns {Object.<String, Buffer>}
 */
function decode(invoice) {
  let { prefix, words } = bech32.decode(invoice, Number.MAX_SAFE_INTEGER);
  return {
    prefix,
    words,
  };
}

/**
 * Encodes a prefix and words
 * @param {string} prefix
 * @param {Buffer} words
 */
function encode(prefix, words) {
  return bech32.encode(prefix, words, Number.MAX_SAFE_INTEGER);
}

/**
 * Converts a Buffer into a a word array
 * @param {Buffer} data
 * @param {number} inBits
 * @param {number} outBits
 * @param {boolean} pad
 * @return {Array[number]} converted words
 */
function convertWords(data, inBits, outBits, pad = true) {
  var value = 0;
  var bits = 0;
  var maxV = (1 << outBits) - 1;

  var result = [];
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  if (pad && bits > 0) {
    result.push((value << (outBits - bits)) & maxV);
  }

  return result;
}

/**
 * Calculates the number of words needed to store the
 * supplied number
 * @param {number} num
 */
function sizeofNum(num) {
  return Math.ceil(Math.log2(num) / 5);
}

/**
 * Calculates the number of words needed to store
 * the supplied number of bits
 * @param {number} bits
 */
function sizeofBits(bits) {
  return Math.ceil(bits / 5);
}
