const express = require('express');
const app = express();

const simplePromise = require('./controllers/1_simple_promise');
const multiLevelPromises = require('./controllers/2_multi_level_promises');
const multiDirectionalPromises = require('./controllers/3_multi_directional_promises');
const expressNext = require('./controllers/4_express_next');
const unhandled = require('./controllers/5_unhandled');

// require

const nodeErr = require('../index');

app.get('/', (req, res) => res.send('hello'));

// examples

app.get('/1-simple-promise', simplePromise);
app.get('/2-multi-level-promises', multiLevelPromises);
app.get('/3-multi-directional-promises', multiDirectionalPromises);
app.get('/4-express-next', expressNext);
app.get('/5-unhandled', unhandled);

// report and return plain, unhandled errors

app.use((err, req, res, next) => {
  nodeErr.stop(err, { req });
  return next(err);
});

// not found

app.use((req, res, next) => res.sendStatus(404));

// send errors however you like

app.use((err, req, res, next) => {
  return (err._status ? res.sendStatus(err._status) : res.sendStatus(500))
});

app.listen(5000);