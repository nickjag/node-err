let config = {
  status: 500,
  overrideResponses: true,
  prefix: 'SERVER_ERROR',
  logger: defaultLogger,
  template: null,
  debug: false,
};

/**
 * Optional setup function.
 *
 * Used to apply custom options.
 *
 * @param {object}    opts                  Containing all data.
 * @param {number}    opts.status           Default error status code.
 * @param {string}    opts.prefix           Prefix for error name.
 * @param {func}      opts.logger           Logging handler function, accepts err argument.
 * @param {boolean}   opts.debug            Debug mode.
 * @param {array}     opts.responses        Array of response template properties.
 * 
 * @return {undefined}
 */
const setup = function(opts={}) {

  if (opts.responses
    && typeof opts.responses === 'object'
    && opts.responses.length
    && opts.responses.length > 0) {
    
    opts.template = opts.responses;
  }

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
 * @param {boolean}   [opts.log]        Optionally skip logger.
 * @param {boolean}   [opts.censor]     Optionally censor req body logging.
 * @param {number}    [opts.status]     Http status to return.
 * @param {object}    [opts.context]    Custom data to attach to error.
 * @param {object}    [ops.responses]   Data to apply to response template.
 * 
 * @return {undefined}                  Nothing returned;
 */
const report = function(err, opts) {

  if (err._reported) {
    return;
  }

  let {
    name='UNREPORTED',
    status=config.status,
    context=null,
    req=null,
    log=true,
    censor=false,
  } = opts;

  err._reported    = true;
  err._name       = config.prefix + ' - ' + name;
  err._status     = status;
  err._context    = context;
  err._censor     = censor;
  err._time       = Math.floor(Date.now());
  err._response   = generateResponse(config.template, opts.responses);

  if (req) {
    err._ipAddr      = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    err._reqUrl      = req.protocol + '://' + req.get('host') + req.originalUrl;
    err._reqBody     = !err._censor ? req.body : 'CENSORED';
    err._reqMethod   = req.method;
    err._userAgent   = req.headers['user-agent'];
  }

  if (log) {
    config.logger(err);
  }

  return;
}

/**
 * Error responder.
 * 
 * Mutates/adds response information to error object. 
 * Automatically overrides the original error responses and status.
 *
 * @param {object}    err               Main error object.
 * @param {object}    opts              Options object.
 * @param {boolean}   [opts.log]        Optionally skip logger.
 * @param {boolean}   [opts.censor]     Optionally censor req body logging.
 * @param {object}    [opts.req]        Express request object.
 * @param {number}    [opts.status]     Http status to return.
 * @param {object}    [opts.responses]  Data to override/apply to response template.
 * 
 * @return {undefined}                  Nothing returned;
 */
const respond = function(err, opts) {

  let modified = false;
  
  let {
    responses=null,
    status=null,
    req=null,
    log=true,
    censor=false,
  } = opts;

  if (status) {
    err._status = status;
    modified = true;
  }

  if (censor) {
    err._censor = censor;
    modified = true;
  }

  if (responses) {
    err._response = generateResponse(config.template, opts.responses);
    modified = true;
  }

  if (req) {
    err._ipAddr      = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    err._reqUrl      = req.protocol + '://' + req.get('host') + req.originalUrl;
    err._reqBody     = !err._censor ? req.body : 'CENSORED';
    err._reqMethod   = req.method;
    err._userAgent   = req.headers['user-agent'];
    modified = true;
  }
  
  if (log && modified) {
    config.logger(Object.assign(err, { _name: 'RESPONSE_OVERRIDE' }));
  }
  
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
  else if (config.overrideResponses) {
    respond(err, opts);
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
      
      if (config.overrideResponses) {
        respond(err, opts);
      }

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

    if (config.overrideResponses) {
      respond(err, opts);
    }
    
    return;
  }

  report(err, opts);
  return;
}

/**
 * Generate an error response for the error.
 *
 * @param {object}      err             Main error object or custom.
 *
 * @return {object}                     Error Response Object
 */
const generateResponse = function(template, responses) {
  
  if (!template || !responses) {
    return null;
  }

  let response = template.reduce(function (obj, item) {
    obj[item] = (responses && responses[item]) ? responses[item] : null;
    return obj;
  }, {});

  return JSON.stringify(response);
}

/**
 * Get status code of an error.
 *
 * @param {object}      err             Main error object or custom.
 * 
 * @return {number}                     Status code
 */
const getStatus = function(err) {
  return err._status || config.status;
}

/**
 * Get response template for an error.
 *
 * @param {object}      err             Main error object or custom.
 * 
 * @return {obj}                        Response object to surface.
 */
const getResponse = function(err) {
  return err._response ? JSON.parse(err._response) : getStatus(err);
}

/**
 * Add padding to error logging.
 * 
 * @return {string}                     Line break string for cleaner output.
 */
const pad = function(n=30, s='*') {
  let ln = [...Array(n)].reduce(ln => ln + s, "");
  return "\n" + ln + "\n";
}

/**
 * Default logger.
 * 
 * @param {object}      err             Main error object or custom.
 * 
 * @return {undefined}                  Nothing returned;
 */
function defaultLogger(err) {
  console.warn( 
    pad(),
    err._name,
    err,
    pad()
  );
}

// exports

module.exports = {
  setup,
  repeat,
  stop,
  getStatus,
  getResponse,
  logger: defaultLogger
};
