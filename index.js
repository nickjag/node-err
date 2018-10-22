
// Configuration defaults.

let config = {
  prefix: 'SERVER_ERROR',
  logger: defaultLogger,
  defaultErrorStatus: 500,
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
 * @param {object}  err             Main error object.
 * @param {boolean} rethrow         Should re-throw the error.
 * @param {object}  opts            Options object.
 * @param {string}  [opts.name]     (optional) Name of error.
 * @param {object}  [opts.req]      (optional) Express request object.
 * @param {*}       [opts.output]   (optional) Output value, see docs.
 * @param {number}  [opts.status]   (optional) Http status to return.
 * @param {object}  [opts.context]  (optional) Custom data to attach to error.
 * 
 * @return {(object|*)} Promise rejection or custom output value.
 */
const handle = function(err, opts={}, rethrow=true) {

  // destructure options

  let {
    name='UNHANDLED',
    req=null,
    output=null,
    status=config.defaultErrorStatus,
    context=null } = opts;
  
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
  err._name       = config.prefix + ' - ' + name;
  err._status     = status;
  err._context    = context;
  err._time       = Math.floor(Date.now());

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

  // rethrow or not

  return (rethrow) ? Promise.reject(err) : (output || err);
}

/**
 * Express middleware for error handling.
 *
 * Use this to catch unhandled errors after routing.
 */
const grab = function(err, req, res, next) {

  // return just the error (no promise)
  if (err._handled) {
    return next(err);
  }

  // add reporting to unhandled errors
  return handle(err, { req }).catch(err => next(err));
}

/**
 * Express helper for next.
 *
 * Use this to send the error to the Express next callback.
 */
const end = function(err) {

  // return just the error (no promise)
  if (err._handled) {
    return err;
  }

  // add reporting to unhandled errors
  // and return just error (no promise)
  
  return handle(err, {}, false);
}

function defaultLogger(err) {

  console.warn(err._name, err);
}

// exports

module.exports = { init, handle, end, grab };