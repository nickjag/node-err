
// Configuration defaults.

let config = {
  prefix: 'SERVER_ERROR',
  defaultErrorStatus: 500,
  logger: (err) => console.warn(err._name, err),
  debug: false,
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
 * Main error handler.
 *
 * Used in various interfaces (oneway, intersection, stop).
 * Default behavior is to rethrow error.
 *
 * @param {object}  err             Main error object.
 * @param {object}  opts            Options object.
 * 
 * @param {string}  [opts.name]     (optional) Name of error.
 * @param {object}  [opts.req]      (optional) Express request object.
 * @param {number}  [opts.status]   (optional) Http status to return.
 * @param {object}  [opts.context]  (optional) Custom data to attach to error.
 * 
 * @return {(object|*)} Promise rejection or custom output value.
 */
const report = function(err, opts) {

  if (err._reported) {
    return;
  }

  // destructure options

  let {
    name='UNHANDLED',
    req=null,
    status=config.defaultErrorStatus,
    context=null } = opts;
  
  // add information about the error.

  err._reported    = true;
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

  return;
}

const rethrow = function(err) {

  if (config.debug) {
    console.log('Error re-thrown at: ', err._name);
  }
  
  return Promise.reject(err);
}

/**
 * Main error handling utility.
 *
 * Use this in a catch block.
 *
 * @param {object|*}  arg   Main error object or custom.
 * @param {object}    opts  Options object.
 * 
 * @return {(object)}     Promise rejection.
 */
const repeat = (arg, opts={}) => {

  // check if we have an error or custom output

  return (arg instanceof Error) ? handleError(arg, opts) : handleCustom(arg);
}

const handleError = function(arg, opts) {
  
  if (!arg._reported) {
    report(arg, opts);
  }

  return rethrow(arg);
}

const handleCustom = function(arg) {
  
  return (err, opts={}) => {

    if (err._reported) {
      return rethrow(err);
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

const stop = function(err, opts={}) {

  // return just the error (no promise)
  
  if (err._reported) {
    return;
  }
  
  report(err, opts);
  return;
}


const getStatus = function(err) {
  return err._status || config.defaultErrorStatus;
}

// exports

module.exports = { init, repeat, stop, getStatus };