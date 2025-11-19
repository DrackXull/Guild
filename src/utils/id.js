const { randomUUID } = require('crypto');

function createId(prefix = 'id') {
  return `${prefix}_${randomUUID()}`;
}

module.exports = {
  createId
};
