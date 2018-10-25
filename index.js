let config = {
  prefix: 'SERVER_ERROR',
  status: 500,
  debug: false,
  logger: err => console.warn(err._name, err),
};

/**
 * Optional setup function.
 *
 * Used to apply custom options.
 *
 * @param {object}    opts              Containing all data.
 * @param {number}    opts.status       Default error status code.
 * @param {string}    opts.prefix       Prefix for error name.
 * @param {func}      opts.logger       Logging handler function, accepts err argument.
 * @param {boolean}   opts.debug        Debug mode.
 * 
 * @return {undefined}
 */
const setup = function(opts={}) {
  config = {
    ...config,
    ...opts,
  };
}

/**
 * Error reporter.
 * 
 * Mutates/adds error information to error object. 
 * Reports the error to the console (or custom logging func).
 *
 * @param {object}    err               Main error object.
 * @param {object}    opts              Options object.
 * @param {string}    [opts.name]       Name of error.
 * @param {object}    [opts.req]        Express request object.
 * @param {number}    [opts.status]     Http status to return.
 * @param {object}    [opts.context]    Custom data to attach to error.
 * 
 * @return {undefined}                  Nothing returned;
 */
const report = function(err, opts) {

  if (err._reported) {
    return;
  }

  let {
    name='UNHANDLED',
    status=config.status,
    context=null,
    req=null,
  } = opts;

  err._reported    = true;
  err._name       = config.prefix + ' - ' + name;
  err._status     = status;
  err._context    = context;
  err._time       = Math.floor(Date.now());

  if (req) {
    err._ipAddr      = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    err._reqUrl      = req.protocol + '://' + req.get('host') + req.originalUrl;
    err._reqBody     = req.body;
    err._reqMethod   = req.method;
    err._userAgent   = req.headers['user-agent'];
  }

  config.logger(err);
  return;
}

/**
 * Main error handling utility.
 *
 * Use this in a catch block.
 *
 * @param {(object|*)}  arg             Main error object or custom value.
 * @param {object}      opts            Options object.
 * @param {string}      [opts.name]     Name of error.
 * @param {object}      [opts.req]      Express request object.
 * @param {number}      [opts.status]   Http status to return.
 * @param {object}      [opts.context]  Custom data to attach to error.
 * 
 * @return {(object|func)}              Promise rejection or function.
 */
const repeat = (arg, opts={}) => {
  return (arg instanceof Error) ? handleError(arg, opts) : handleCustom(arg);
}

/**
 * Error re-thrower.
 *
 * Re-throws the error with a debug logging option.
 *
 * @param {object}      err             Main error object or custom.
 * @param {object}      opts            Options object.
 * @param {string}      [opts.name]     Name of error.
 * 
 * @return {object}                     Promise rejection.
 */
const rethrow = function(err, opts) {

  if (config.debug) {
    console.log('Error re-thrown at: ', (opts.name || null));
  }

  return Promise.reject(err);
}

/**
 * Handle an error.
 *
 * Handles the error reporting and rethrow.
 *
 * @param {object}      err             Main error object or custom.
 * @param {object}      opts            Options object.
 * @param {string}      [opts.name]     Name of error.
 * @param {object}      [opts.req]      Express request object.
 * @param {number}      [opts.status]   Http status to return.
 * @param {object}      [opts.context]  Custom data to attach to error.
 * 
 * @return {object}                     Promise rejection.
 */
const handleError = function(err, opts) {
  
  if (!err._reported) {
    report(err, opts);
  }

  return rethrow(err, opts);
}

/**
 * Handle custom value.
 *
 * Handles the error reporting and custom value.
 *
 * @param {*}           arg             Custom value.
 * 
 * @return {func}                       Callback function.
 */
const handleCustom = function(arg) {
  
  return (err, opts={}) => {

    if (err._reported) {
      return rethrow(err, opts);
    }

    let name = (opts.name || err.name || '');

    report(err, { 
      ...opts, 
      name: name += '; SILENCED;',
      status: '0'
    });

    return (typeof arg === 'undefined') ? err : arg;
  }
}

/**
 * Stop promisification of an error (no re-throw).
 *
 * Reports the error if not reported, but does not re-thow.
 *
 * @param {object}      err             Main error object or custom.
 * @param {object}      opts            Options object.
 * @param {string}      [opts.name]     Name of error.
 * @param {object}      [opts.req]      Express request object.
 * @param {number}      [opts.status]   Http status to return.
 * @param {object}      [opts.context]  Custom data to attach to error.
 * 
 * @return {undefined}                  Nothing returned;
 */
const stop = function(err, opts={}) {

  // return just the error (no promise)
  
  if (err._reported) {
    return;
  }

  report(err, opts);
  return;
}

/**
 * Get status code of error.
 *
 * @param {object}      err             Main error object or custom.
 * 
 * @return {number}                     Status code
 */
const getStatus = function(err) {
  return err._status || config.status;
}

// exports

module.exports = { setup, repeat, stop, getStatus };