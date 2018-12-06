const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  nodeErr.setup({
    responses: ['user_message','an_unset_property'],
  });

  /**
   * Simple promise chain example.
   * 
   * The first time repeat is used, the error will receive 
   * custom details, be reported, and then re-thrown. If an error 
   * has already passed through repeat, it will just be re-thrown.
   */

  return Promise.resolve()
    .then(() => {
      let error = new Error('Cannot fetch users.');
      return Promise.reject(error);
    })
    .catch(err => {
      return nodeErr.repeat(err, {
        name: 'FETCH_USERS_QUERY',
        status: 500,
        responses: { user_message: 'Oops! Something happened.' }
      });
    })
    .catch(err => {
      let statusCode = nodeErr.getStatus(err);
      let outputResponse = nodeErr.getResponse(err);
      
      return res.status(statusCode).send(outputResponse);
    });

}