let config = {
  prefix: 'SERVER_ERROR',
  status: 500,
  debug: false,
  logger: err => console.warn(err._name, err),
  responseTemplate: {
    error_code: "error_code",
    error_type: "error_type",
    error_message: "error_message",
    error_context: "error_context",
    error_fields: "error_fields",
  }
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
    template=config.responseTemplate,
    response=null
  } = opts;

  err._reported    = true;
  err._name       = config.prefix + ' - ' + name;
  err._status     = status;
  err._context    = context;
  err._time       = Math.floor(Date.now());
  err._template   = template;
  err._response   = response;

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
 * Use this in a catch block. Accepts args for invoking 
 * one of two different behaviors: error re-throwing 
 * or custom value handling.
 *
 * @param {(object|*)}        arg             Main error object or custom value.
 * @param {(object|boolean)}  arg2            Options object or boolean.
 * 
 * @param {string}            [arg2.name]     Name of error.
 * @param {object}            [arg2.req]      Express request object.
 * @param {number}            [arg2.status]   Http status to return.
 * @param {object}            [arg2.context]  Custom data to attach to error.
 * 
 * @return {(object|func)}                    Promise rejection or function.
 */
const repeat = (arg, arg2) => {

  if (arg instanceof Error) {
    let opts = (typeof arg2 === 'undefined') ? {} : arg2;
    return handleError(arg, opts);
  }
  else {
    let addReport = (typeof arg2 === 'undefined') ? false : true;
    return handleCustom(arg, addReport);
  }
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
 * @param {*}           customVal       Custom value.
 * @param {boolean}     addReport       Add reporting/logging or not.
 * 
 * @return {func}                       Callback function.
 */
const handleCustom = function(customVal, addReport) {
  
  return (err, opts={}) => {

    if (err._reported) {
      return rethrow(err, opts);
    }

    if (addReport) {

      let name = (opts.name || err.name || '');

      report(err, { 
        ...opts, 
        name: name += '; SILENCED;',
        status: '0'
      });
    }

    return (typeof customVal === 'undefined') ? err : customVal;
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

/**
 * Generate an error response for the error.
 *
 * @param {object}      err             Main error object or custom.
 *
 * @return {object}                     Error Response Object
 */
const getResponse = function(err) {
  return {
    [err._template.error_code]: err._response[err._template.error_code],
    [err._template.error_type]: err._response[err._template.error_type],
    [err._template.error_message]: err._response[err._template.error_message],
    [err._template.error_context]: err._response[err._template.error_context],
    [err._template.error_field]: err._response[err._template.error_field],
  };
}

// exports

module.exports = { setup, repeat, stop, getStatus };