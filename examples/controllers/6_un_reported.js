module.exports = (req, res, next) => {

  // Un-reported errors will be caught by Express middleware.

  return next(new Error());
  
}