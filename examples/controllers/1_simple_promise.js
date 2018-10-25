const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Simple promise chain example.
   * 
   * The first time handleErr is used, the error will receive 
   * custom details before re-throwing. And each subsequent pass
   * it will automatically re-throw (without adding details).
   * 
   */
  

  return Promise.resolve()
    .then(() => {
      let error = new Error('test error');
      return Promise.reject(error);
    })
    .catch(err => {
      return nodeErr.repeat(err, { name: 'MY_CUSTOM_ERROR' });
    })
    .then(() => {
      // skipped
    })
    .catch(err => {
      let statusCode = nodeErr.getStatus(err);
      return res.status(statusCode).send('An error ocurred.');
    });

}