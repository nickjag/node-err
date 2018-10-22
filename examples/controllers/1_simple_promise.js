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

      // handle and re-throw error

      return nodeErr.handle(err);
    })
    .catch(err => {
      
      // catch the error

      return res.status(400).send('An error ocurred.');
    });

}