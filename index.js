
let config = {
  prefix: 'SERVER_ERROR',
  logger: defaultLogger,
};

/**
 * Optional init function.
 *
 * Use this to apply custom options.
 *
 * @param {object}      opts Containing all data.
 * @param {string}      opts.prefix Prefix for error name.
 * @param {func}        opts.logger Logging handler function, accepts err argument.\
 * 
 * @return {undefined}
 */
const init = function(opts={}) {
  
  config = {
    ...config,
    ...opts,
  };
}

/**
 * Main error handling utility.
 *
 * Use this in a catch block or promise catch.
 * Default behavior is to rethrow error.
 *
 * @param {object}  params            Containing all data.
 * @param {object}  params.err        Main error object.
 * @param {string}  params.name       Name of error.
 * @param {object}  [params.req]      (optional) Express request object.
 * @param {boolean} [params.silent]   (optional) Error silencer (only logs).
 * @param {*}       [params.output]   (optional) Output value, see docs.
 * @param {number}  [params.status]   (optional) Http status to return.
 * @param {object}  [params.context]  (optional) Custom data to attach to error.
 * 
 * @return {(object|*)} Promise rejection or custom output value.
 */
const handleErr = function({ err, name, req, silent, output, status, context }) {

  // create undefined error if we dont have an error.

  if (!err) {
    err = new Error('Undefined Error');
  }

  // if we already handled this error, throw it again.

  if (err._handled) {
    return Promise.reject(err);
  }

  // add information about the error.

  err._handled    = true;
  err._name       = config.prefix + ' - ' + (name || 'UNHANDLED)');
  err._status     = (status || 500);
  err._context    = (context || null);
  err._time       = Math.floor(Date.now());
  
  // err.outputJSON  = false;

  // add information about the request.

  if (req) {
    err._ipAddr      = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    err._reqUrl      = req.protocol + '://' + req.get('host') + req.originalUrl;
    err._reqBody     = req.body;
    err._reqMethod   = req.method;
    err._userAgent   = req.headers['user-agent'];
  }

  // apply logger function (defaults to console)

  config.logger(err);

  // return silent output value.

  if (silent) {
    return handleSilent(err, output);
  }

  // return rejection.
  
  return Promise.reject(err);
}

/**
 * Express middleware for error handling.
 *
 * Use this to catch unhandled errors after routing.
 */
const catchUnhandled = function(err, req, res, next) {
  
  // add reporting to unhandled errors

  if (err._handled) {
    return next(err);
  }

  handleErr({ err, req }).catch(err => next(err));
}

const handleSilent = function(err, output) {

  err._name += '; silenced;';

  // pass the desired return value back up.

  return (output || false);
}

const defaultLogger = function(err) {
  console.warn(err._name, err);
}

// exports

module.exports = {
  default: init,
  handleErr: handleErr,
  catchUnhandled: catchUnhandled,
};