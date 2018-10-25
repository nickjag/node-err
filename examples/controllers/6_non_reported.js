module.exports = (req, res, next) => {

  // Non-reported errors will be caught by Express middleware.

  return next(new Error());
  
}