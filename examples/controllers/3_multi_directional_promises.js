const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Multi-directional promise - bubble-up error with 
   * localized error handling as well.
   * 
   * A level 3 error will still bubble-up to level 1, but a
   * level 2 error will send a customized output to level 1.
   */

  // Level 1

  return Promise.resolve()
    .then(() => level2())
    .then(result => {
      return res.send(result);
    })
    .catch(err => {
      let statusCode = nodeErr.getStatus(err);
      return res.status(statusCode).send('An error ocurred.');
    });

  // Level 2

  function level2() {
    return Promise.resolve()
      .then(() => level3())
      .then(() => {
        let error = new Error('level 2 error');
        return Promise.reject(error);
      })
      .then(() => {
        return 'Follow the money.';
      })
      .catch(err => {
        return nodeErr.repeat('Follow the white rabbit.')(err, { name: 'LEVEL_2_ERROR' });
      });
  }

  // Level 3
  
  function level3() {
    return Promise.resolve()
      .then(() => {
        // let error = new Error('level 3 error');
        // return Promise.reject(error);
      })
      .catch(err => {
        return nodeErr.repeat(err, { name: 'LEVEL_3_ERROR' });
      });
  }
}