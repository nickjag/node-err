const fetch = require('node-fetch');
const nodeErr = require('../../index');

module.exports = (req, res, next) => {
  
  let errorApi = (req.testMode ? null : 'https://jsonplaceholder.typicode.com/todos/1'); 

  /**
   * Simple promise chain example.
   * 
   * The first time handleErr is used, the error will receive 
   * custom details before re-throwing. And each subsequent pass
   * it will automatically re-throw (without adding details).
   * 
   */

  return fetch(errorApi)
    .then(response => {
      return response.json();
    })
    .then(json => {
      return res.send(json);
    })
    .catch(err => {
      
      // handle (with extra data) and re-throw error

      return nodeErr.handle(err, {
        name: 'MY_ERROR_NAME',
        context: 'Error code: 12345',
        status: 404,
        req: req
      });
      
    })
    .catch(err => {
      
      // catch the error

      return res.status(err._status).send('A 404 (not found) error ocurred.');
    });

}