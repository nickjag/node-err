const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Stopping the promise chain.
   * 
   * Use the stop() function to add reporting to
   * an error before using the Express next().
   */

  return Promise.resolve()
    .then(() => {
      let error = new Error('test error');
      return Promise.reject(error);
    })
    .catch(err => {
      nodeErr.stop(err, { name: 'MY_CUSTOM_ERROR' });
      return next(err);
    });

}