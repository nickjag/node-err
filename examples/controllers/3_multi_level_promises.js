const fetch = require('node-fetch');
const nodeErr = require('../../index');

module.exports = (req, res, next) => {
  
  let errorApi = (req.testMode ? null : 'https://jsonplaceholder.typicode.com/users/1'); 

  /**
   * Multi-level promise chain example.
   * 
   * The first time handleErr is used, the error will receive 
   * custom details before re-throwing. And each subsequent pass
   * it will automatically re-throw (without adding details).
   * 
   */

  // Level 1

  return fetchTodos()
    .then(obj => {
      return res.send(obj);
    })
    .catch(err => {
      
      // automatically pass/re-throw error

      return nodeErr.handle(err);
    })
    .catch(err => {
      
      // catch the error

      return res.status(400).send('An error ocurred.');
    });

  // Level 2

  function fetchTodos() {

    let obj = {};
  
    return fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => {
        return response.json();
      })
      .then(json => {
        obj.todos = json;
        return fetchUsers();
      })
      .then(response => {
        return response.json();
      })
      .then(json => {
        obj.users = json;
        return obj;
      })
      .catch(err => {
        
        // automatically pass/re-throw error
        
        return nodeErr.handle(err);
      });
  }

  // Level 3 (error is thrown here)

  function fetchUsers() {
    
    return fetch(errorApi)
      .then(response => {
        return response;
      })
      .catch(err => {

        // handle and re-throw error

        return nodeErr.handle(err);
      });
  }

}