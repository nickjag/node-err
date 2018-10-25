const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Handing error back using the Express next().
   * 
   * Use stop() function to add reporting to
   * an error before using the Express next().
   * 
   */

  return Promise.resolve()
    .then(() => {
      let error = new Error('test error');
      return Promise.reject(error);
    })
    .catch(err => {
      nodeErr.stop(err, { name: 'MY_CUSTOM_ERROR', status: 401 });
      return next(err);
    });

}