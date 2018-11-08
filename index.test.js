const assert = require('assert');
const nodeErr = require('./');

describe('#repeat', () => {
  const error = () => {
    throw new Error('I AM ERROR');
  }

  it('throws an error', () => {
      assert.throws(() => nodeErr.repeat(error()), /^Error: I AM ERROR$/);
  });
});
