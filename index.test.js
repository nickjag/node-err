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

describe('#getResponse', () => {
  it('returns a custom response message', () => {
    nodeErr.setup({
      responses: [
        'my_custom_error',
        'some_other_message',
      ],
    });

    try {
      throw new Error('I AM ERROR');
    } catch (err) {
      nodeErr.repeat(err, {
        responses: {
          my_custom_error: 'I forgot to carry the two',
          some_other_message: 'I should also be returned',
        }
      });

      const expectedResponses = JSON.stringify({
        my_custom_error: 'I forgot to carry the two',
        some_other_message: 'I should also be returned',
      });

      assert.deepEqual(nodeErr.getResponse(err), expectedResponses);
    }
  });

  it('should ignore responses not in the template', () => {
    nodeErr.setup({
      responses: [
        'my_custom_error',
        'nullified_error',
      ],
    });

    try {
      throw new Error('I AM ERROR');
    } catch (err) {
      nodeErr.repeat(err, {
        responses: {
          my_custom_error: 'I forgot to carry the two',
          error_that_should_not_be: 'I should not be returned',
        }
      });

      const expectedResponses = JSON.stringify({
        my_custom_error: 'I forgot to carry the two',
        nullified_error: null,
      });

      assert.deepEqual(nodeErr.getResponse(err), expectedResponses);
    }
  });
});
