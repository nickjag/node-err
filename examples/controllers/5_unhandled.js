module.exports = (req, res, next) => {

  // Unhandled error, caught by index.js Express middleware.

  return next(new Error());
  
}