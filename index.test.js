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

describe('#getStatus', () => {
  it('returns an http status', () => {
    try {
      throw new Error('I AM ERROR');
    } catch (err) {
      assert.equal(nodeErr.getStatus(err), 500);
    }
  });

  it('should allow configuration of http status', () => {
    nodeErr.setup({ status: 401 });

    try {
      throw new Error('I AM ERROR');
    } catch (err) {
      assert.equal(nodeErr.getStatus(err), 401);
    }
  });
});

