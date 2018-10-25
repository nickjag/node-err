const nodeErr = require('../../index');

module.exports = (req, res, next) => {

  /**
   * Async/await chain example.
   * 
   * Works the same way as promises. But use the `await` keyword
   * when using the nodeErr.repeat in an async catch block.
   * 
   */

  (async function() {

    // level 1
    try {
      
      // level 2
      try {
      
        // level 3
        await level3();
  
      } catch(err) {
        
        await nodeErr.repeat(false)(err, { name: 'LEVEL_2_ERROR' });
      }

    } catch(err) {
      
      await nodeErr.repeat(err, { name: 'LEVEL_1_ERROR' });
    }

  })()
    .catch(err => {
      let statusCode = nodeErr.getStatus(err);
      return res.status(statusCode).send('An error ocurred.');
    });

  function level3() {
    
    try {

      throw new Error('level 3 error');

    } catch (err) {

      return nodeErr.repeat(err, { name: 'LEVEL_3_ERROR' });
    }
  }
  
}