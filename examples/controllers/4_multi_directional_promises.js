const fetch = require('node-fetch');
const nodeErr = require('../../index');

module.exports = (req, res, next) => {
  
  let errorApi = (req.testMode ? null : 'https://jsonplaceholder.typicode.com/photos/1'); 

  /**
   * Multi-level promise chain example.
   * 
   * The first time handleErr is used, the error will receive 
   * custom details before re-throwing. And each subsequent pass
   * it will automatically re-throw (without adding details).
   * 
   */



  //  TODO: start here, clean it up so the level can be selected/determined where to fail! (or do it randomly maybe)
  // level1api = asdf, etc.
  // make use of a better example of chaining that is not anti-pattern?
  // And then go back to 3 and use the same example, pulling object out of the chain. 

  let obj = {};

  // Level 1

  return fetchTodos()
    .then(() => {
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
  
    return fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => {
        return response.json();
      })
      .then(json => {
        obj.todos = json;
        return fetchUsers();
      })
      .catch(err => {
        
        // automatically pass/re-throw error
        
        return nodeErr.handle(err, {
          name: 'LEVEL_2_ERROR'
        });
      });
  }

  // Level 3

  function fetchUsers() {
    
    return fetch('https://jsonplaceholder.typicode.com/users/1')
      .then(response => {
        return response.json();
      })
      .then(json => {
        obj.users = json;
        return fetchPhotos();
      })
      .catch(err => {

        // automatically pass/re-throw error

        return nodeErr.handle(err, {
          name: 'LEVEL_3_ERROR'
        });
      });
    }

    // Level 4 (error is thrown here)

    function fetchPhotos() {
      
      return fetch(errorApi)
        .then(response => {
          return response.json();
        })
        .then(json => {
          obj.photos = json;
          return;
        })
        .catch(err => {

          // handle and re-throw error

          return nodeErr.handle(err, {
            name: 'LEVEL_4_ERROR'
          });
        });
    }

}