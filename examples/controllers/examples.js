module.exports = (req, res, next) => {
  
  let index = ''+
  '<a href="/1-simple-promise">1 - Simple Promises</a><br>'+
  '<a href="/2-multi-level-promises">2 - Multi-level Promises</a><br>'+
  '<a href="/3-multi-directional-promises">3 - Multi-directional Promises</a><br>'+
  '<a href="/4-stopping-promises">4 - Stopping Promises</a><br>'+
  '<a href="/5-async-await">5 - Async/Await</a><br>'+
  '<a href="/6-unreported">6 - Unreported Errors</a><br>';

  res.send(index);
}