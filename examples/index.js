
const express = require('express');
const app = express();
const setup = require('./setup');

setup(app);

const simplePromise = require('./controllers/1_simple_promise');
const simplePromiseCustom = require('./controllers/2_simple_promise_custom');

const multiLevelPromises = require('./controllers/3_multi_level_promises');
const multiDirectionalPromises = require('./controllers/4_multi_directional_promises');
const expressNext = require('./controllers/5_express_next');


// require

const nodeErr = require('../index');

// config (optional)

nodeErr.init({ defaultErrorStatus: 500 });

// examples

app.get('/1-simple-promise', simplePromise);
app.get('/2-simple-promise-custom', simplePromiseCustom);
app.get('/3-multi-level-promises', multiLevelPromises);
app.get('/4-multi-directional-promises', multiDirectionalPromises);
app.get('/5-express-next', expressNext);

app.use(nodeErr.grab);

// not found

app.use((req, res, next) => res.sendStatus(404));

// send errors

app.use((err, req, res, next) => {
  console.log('sending stat', err._status);
  return (err._status ? res.sendStatus(err._status) : res.sendStatus(500))
});

app.listen(5000);