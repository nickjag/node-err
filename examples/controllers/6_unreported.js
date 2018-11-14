module.exports = (req, res, next) => {

  // Unreported errors will be caught by Express middleware.

  return next(new Error());
  
}