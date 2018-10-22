
module.exports = (app) => {
  
  // set up test mode switch

  app.use((req, res, next) => {
    req.testMode = process.env.ENV_TEST || false;
    console.log("---------------------------");
    console.log("Running in test mode? ", req.testMode ? 'yes' : 'no');
    console.log("---------------------------");
    next();
  });

  const samples = [
    '/simple-promise-chain',
    '/multi-level-promises',
  ];

  app.get('/', (req, res) => {
    res.send('hello')
  });

}