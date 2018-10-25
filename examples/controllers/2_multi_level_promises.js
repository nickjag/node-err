const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Multi-level promise - bubble-up error.
   * 
   * Level 1 => level 2, level 2 => level 3. 
   * An error will occur on level 3, which 
   * bubbles-up to level 1.
   */

  // Level 1 (outputs to browser)

  return Promise.resolve()
    .then(() => level2())
    .catch(err => {
      let statusCode = nodeErr.getStatus(err);
      return res.status(statusCode).send('An error ocurred.');
    });

  // Level 2

  function level2() {
    return Promise.resolve()
      .then(() => level3())
      .catch(err => {

        // since a level 3 error is thrown, the
        // level 2 error reporting is bypassed.

        return nodeErr.repeat(err, { name: 'LEVEL_2_ERROR' });
      });
  }

  // Level 3
  
  function level3() {
    return Promise.resolve()
      .then(() => {
        let error = new Error('level 3 error');
        return Promise.reject(error);
      })
      .catch(err => {
        return nodeErr.repeat(err, { name: 'LEVEL_3_ERROR' });
      });
  }
}