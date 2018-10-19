
const express = require('express');
const app = express();
const nodeErr = require('../index');

// routing

app.get('/', (req, res, next) => {
  res.send('asdf');
});

// catch unhandled errors

app.use(nodeErr.catchUnhandled);

// output errors

// todo: try implementation...

// what if they want to set 404 or 500, etc. inside the original error call..?
// or maybe something more custom and render a certain page or?

app.use(nodeErr.outputErrors);


// function main() {
  
// }

// function foo() {

// }






// test config
