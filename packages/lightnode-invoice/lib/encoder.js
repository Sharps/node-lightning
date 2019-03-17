const Decimal = require('decimal.js');
const bech32 = require('bech32');
const bech32Util = require('./bech32-util');
const WordCursor = require('./word-cursor');
const crypto = require('./crypto');
const { FIELD_TYPE } = require('./constants');

module.exports = {
  encode,
  encodeAmount,
  validate,
};

function validate(/*invoice */) {
  // check valid network
  // check valid amount
}

function encode(invoice, privKey) {
  validate(invoice);

  let writer = new WordCursor();

  let encodedAmount = encodeAmount(invoice.amount) || '';
  let prefix = `ln${invoice.network}${encodedAmount}`;

  writer.writeUIntBE(invoice.timestamp, 7);

  _encodeData(invoice, writer);

  // generate sig data
  let sigData = bech32Util.convertWords(writer.words, 5, 8, true);
  sigData = Buffer.concat([Buffer.from(prefix, 'utf8'), Buffer.from(sigData)]);

  // generate sig hash
  let sigHash = crypto.sha256(sigData);

  // sign
  let { signature, recovery } = crypto.ecdsaSign(sigHash, privKey);
  writer.writeBytes(signature);
  writer.writeUIntBE(recovery, 1);

  // finally encode the invoice in bech32 and allow
  // an invoice to be any length
  return bech32.encode(prefix, writer.words, Number.MAX_SAFE_INTEGER);
}

function _decimalDigits(val) {
  val = new Decimal(val);
  for (let i = 0; i <= 12; i++) {
    if (
      val
        .mul(10 ** i)
        .mod(1)
        .equals(0)
    )
      return i;
  }
  return 18;
}

function encodeAmount(amount) {
  if (!amount) return;
  let decs = _decimalDigits(amount);
  if (decs > 9) return (amount * 1e12).toFixed(0) + 'p';
  if (decs > 6) return (amount * 1e9).toFixed(0) + 'n';
  if (decs > 3) return (amount * 1e6).toFixed(0) + 'u';
  if (decs > 0) return (amount * 1e3).toFixed(0) + 'm';
  return amount.toFixed(0);
}

function _encodeData(invoice, writer) {
  for (let datum of invoice.fields) {
    switch (datum.type) {
      case FIELD_TYPE.PAYMENT_HASH:
        writer.writeUIntBE(datum.type, 1);
        writer.writeUIntBE(52, 2);
        writer.writeBytes(datum.value);
        break;
      case FIELD_TYPE.ROUTE:
        {
          let bits = datum.value.length * (264 + 64 + 32 + 32 + 16);
          writer.writeUIntBE(datum.type, 1);
          let dataLen = bech32Util.sizeofBits(bits);
          writer.writeUIntBE(dataLen, 2);
          let buffer = Buffer.alloc(bits / 8);
          let position = 0;
          for (let route of datum.value) {
            route.pubkey.copy(buffer, position);
            position += 264 / 8;
            route.short_channel_id.copy(buffer, position);
            position += 64 / 8;
            buffer.writeUInt32BE(route.fee_base_msat, position);
            position += 32 / 8;
            buffer.writeUInt32BE(route.fee_proportional_millionths, position);
            position += 32 / 8;
            buffer.writeUInt16BE(route.cltv_expiry_delta, position);
            position += 16 / 8;
          }
          writer.writeBytes(buffer);
        }
        break;
      case FIELD_TYPE.EXPIRY:
        {
          let dataLen = bech32Util.sizeofNum(datum.value);
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(dataLen, 2);
          writer.writeUIntBE(datum.value, dataLen);
        }
        break;
      case FIELD_TYPE.FALLBACK_ADDRESS:
        {
          let dataLen = bech32Util.sizeofBits(datum.value.address.byteLength * 8) + 1;
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(dataLen, 2);
          writer.writeUIntBE(datum.value.version, 1);
          writer.writeBytes(datum.value.address);
        }
        break;
      case FIELD_TYPE.SHORT_DESC:
        {
          let buf = Buffer.from(datum.value, 'utf8');
          let dataLen = bech32Util.sizeofBits(buf.byteLength * 8);
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(dataLen, 2);
          writer.writeBytes(buf);
        }
        break;
      case FIELD_TYPE.PAYEE_NODE:
        {
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(53, 2);
          writer.writeBytes(datum.value);
        }
        break;
      case FIELD_TYPE.HASH_DESC:
        {
          let dataLen = bech32Util.sizeofBits(datum.value.byteLength * 8);
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(dataLen, 2);
          writer.writeBytes(datum.value);
        }
        break;
      case FIELD_TYPE.MIN_FINAL_CLTV_EXPIRY:
        {
          let dataLen = bech32Util.sizeofNum(datum.value);
          writer.writeUIntBE(datum.type, 1);
          writer.writeUIntBE(dataLen, 2);
          writer.writeUIntBE(datum.value);
        }
        break;
    }
  }
}
