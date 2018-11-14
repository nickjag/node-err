const express = require('express');
const app = express();

const examples = require('./controllers/examples');
const simplePromise = require('./controllers/1_simple_promise');
const multiLevelPromises = require('./controllers/2_multi_level_promises');
const multiDirectionalPromises = require('./controllers/3_multi_directional_promises');
const stoppingPromises = require('./controllers/4_stopping_promises');
const asyncAwait = require('./controllers/5_async_await');
const unReported = require('./controllers/6_unreported');

// require nodeErr

const nodeErr = require('../index');

// examples

app.get('/', examples);
app.get('/1-simple-promise', simplePromise);
app.get('/2-multi-level-promises', multiLevelPromises);
app.get('/3-multi-directional-promises', multiDirectionalPromises);
app.get('/4-stopping-promises', stoppingPromises);
app.get('/5-async-await', asyncAwait);
app.get('/6-unreported', unReported);

// report and return plain, non-reported errors

app.use((err, req, res, next) => {
  nodeErr.stop(err, { req });
  return next(err);
});

// not found

app.use((req, res, next) => res.sendStatus(404));

// send errors however you like

app.use((err, req, res, next) => res.sendStatus( nodeErr.getStatus(err) ));

app.listen(5000);