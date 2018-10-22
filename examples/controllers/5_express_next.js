const fetch = require('node-fetch');
const nodeErr = require('../../index');

module.exports = (req, res, next) => {
  
  let api = (req.testMode ? null : 'https://jsonplaceholder.typicode.com/todos/1'); 

  // promise chain and return error through next

  return fetch(api)
    .then(response => {
      return response.json();
    })
    .then(json => {
      res.send(json);
    })
    .catch(err => {
 
      // custom return for next
      next(nodeErr.end(err));
    })

}