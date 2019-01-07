# node-err
Simplify error handling and logging for Node.
<br>

## Index
+ [Overview](#overview)
+ [Technical](#technical)
+ [Examples](#examples)
<br>

## Overview<a name="overview"></a>


**One Error Handler**

With node-err, you always use the same error handler, giving you expected behavior...

> `nodeErr.repeat(err);`

```
const nodeErr = require('node-err');

return fetch()
  .catch(err => {
    return nodeErr.repeat(err);
  });
```
<br>

**Bubbling-up Errors**

With consistent error handling, bubbling-up errors is super easy...

```
return fetch()
  .catch(err => {
    return nodeErr.repeat(err);
  })
  .catch(err => {
    return nodeErr.repeat(err);
  })
  .catch(err => {
    return nodeErr.repeat(err);
  })
  .catch(err => {
    return next(err);
  });
```
<br>

**Automatic logging**

And logging/reporting is a breeze, it happens automatically...

> `nodeErr.repeat(err, details);`

```
return fetchUsers()
  .catch(err => {

    let details = {
      name: 'FETCH_USERS',
      status: 500,
    };

    return nodeErr.repeat(err, details);
  });
```
<br>

**Server Logging**

Server logging happens out-of-the-box so you can set-up alerts with a service such as Papertrail...

> `papertrail -f SERVER_ERROR`

![fetch-error](https://user-images.githubusercontent.com/16621118/47524365-6e170180-d868-11e8-9c9d-efcaa8b77f1c.png)
<br>
<br>

**Custom Logging**

But you can set up your only logger too...

> `nodeErr.setup({ logger: myOwnLogger });`

<br>

**Custom Output Responses**

Configure and send response data for outputting to the browser. View the Simple Promises example to see it in action.

```
nodeErr.setup({ responses: ['user_message','internal_code'] });

return saveAnalytics()
  .catch(err => {

    return nodeErr.repeat(err, {
      status: 500,
      responses: {
        user_message: 'Oops! Something went wrong.',
        internal_code: '2352',
      }
    });
  })
  .catch(err => {

    let statusCode = nodeErr.getStatus(err);
    let outputResponse = nodeErr.getResponse(err);
    
    return res.status(statusCode).send(outputResponse);
  });
}
```

<br>

**Localized/Silent Error Handling**

Sometimes you need to handle some errors a little differently, while still allowing other errors to bubble-up or pass through...

> `nodeErr.repeat(customVal)(err);`


```
return saveAnalytics()
  .then(() => {

    // do more stuff with the ability to
    // bubble up a different fatal error

    return true;
  })
  .catch(err => {

    // if our saveAnalytics() failed, lets 
    // keep going and just return false

    return nodeErr.repeat(false)(err);
  })
  .then(result => {

    // did the analytics save ok?

    return (result) ? next() : retry();
  });
}
```

For more details, view the [handling](#handling) sections below.

<br>

**Async/Await**

```
(async function() {
  try {
    throw new Error('cubitum irem');
  } catch(err) {
    await nodeErr.repeat(err, { name: 'Do I know latin?' });
  }
})().catch(err => {
  // Hey Alexa...
});
```
<br>

**Express Middleware**

How about some Express middleware to catch/report any un-reported errors?

> `nodeErr.stop(err);`

```
app.use((err, req, res, next) => {
  let details = { req };
  nodeErr.stop(err, details);
  return next(err);
});
```
<br>

**Error Output**

What should you do with all of these errors? Whatever you like...

> `app.use((err, req, res, next) => res.sendStatus( nodeErr.getStatus(err) ));`

<br>


## Technical<a name="technical"></a>

**Getting Started**

Just require `node-err` and start using `repeat` to automatically log and bubble-up errors...

```
const nodeErr = require('node-err');

return fetch()
  .catch(err => {
    return nodeErr.repeat(err);
  });
```

<br>

**Config Vars (optional)**

Call the `setup` function in your entry file (index.js or server.js) and pass config vars (optional)...

```
const nodeErr = require('node-err');

nodeErr.setup({
  prefix: 'FIND_THIS_ERROR',
  status: 401,
  debug: true,
  logger: (err) => slackChannel('Doh', err)),
  responses: ['user_message'],
  overrideResponses: true,
});
```
<br>

Key | Type | Description
--- | --- | ---
`prefix` | *string* | Global prefix added to all error logs.
`status` | *number* | Default HTTP status code error.
`debug` | *bool* | Output error repetition tracing.
`logger` | *func* | Custom logging function (accepts Error obj).
`responses` | *array* | Array of response properties.
`overrideResponses` | *bool* | Allow automatic overwrite of responses when bubbling up.

<br>


**Additional Error Details (optional)**

When calling `repeat` add some more details so you know what went wrong (optional)...

```
nodeErr.repeat(err, {
  name: 'AWS_IMAGE_NOT_SAVED',
  req: req,
  status: 400,
  context: { imageName: 'budget-report.ppt'},
  responses: { user_message: 'Oops! Something went wrong.' },
  log: false,
  censor: true,
});
```
<br>

Key | Type | Description
--- | --- | ---
`name` | *string* | (optional) Custom error name.
`req` | *object* | (optional) Express request object.
`status` | *bool* | (optional) Desired http status response code.
`context` | *any* | (optional) Whatever works.
`responses` | *object* | (optional) Data to place on the response output.
`log` | *bool* | (optional) Skip logging at this repeat node (intentional errors).
`censor` | *bool* | (optional) Skip request body log (persists with bubbling up).

<br>

If `req` is provided, you'll also get access to:

+ IP Address
+ Requested URL
+ Request Body
+ Request Method
+ User Agent

Any `responses` data provided, must have its property added to the `setup` config.

<br>

**Basic Block Error Handling/Bubbling**<a name="handling"></a>

By default, calling `repeat` on an error the first time will create an error report and then reject it again with a `Promise.reject`.

Calling `repeat` again (in subsequent catch block) on an already reported error will just reject the same error again (no further reporting).

```
return fetch()
  .then(() => Promise.reject('level 1 error please'))
  .catch(err => {
    return nodeErr.repeat(err, { name: 'level 1' }); // report and rejects again
  })
  .then(() => doSomething()
  .catch(err => {
    return nodeErr.repeat(err, { name: 'level 2' }); // rejects level 1 error again
  })
  .then(() => doSomething()
  .catch(err => {
    return nodeErr.repeat(err, { name: 'level 3' }); // rejects level 1 error again
  })
  .catch(err => {
    return next(err); // returns level 1 error
  });
```

In this way, errors can bubble back up and be handled however you like.

<br>

**Multi-directional Error Handling**

You might want to handle some error differently, while still allowing processes above it to pass/bubble their errors through. 

By using `repeat` with a custom value, which returns a callback and accepts, you can achieve multi-directional functionality:

+ Any previously reported will continue to bubble up and through.
+ Any un-reported errors will output with whatever value you set.

In this way, you can have a silent error handler for one process without breaking promise chain for processes above/before it.

<br>

> `nodeErr.repeat('It failed!')(err);`

```
return saveAnalytics()
  .then(() => {
    return fetchUser();
  })
  .catch(err => {

    // if we didnt have a db conn error, and instead had an error
    // from saveAnalytics, the below would just return `false`

    return nodeErr.repeat(false)(err); // our db conn error will pass through
  })
  .then(result => {
    return (result) ? next() : retry(); // this is skipped because of our db conn error
  })
  .catch(err => {
    return next(err); // return db conn error
  })
}

function fetchUser() {

  return fetch()
    .then(result => {
      throw new Error('remote db conn err'); // fire error
    })
    .then(() => true) // this is skipped
    .catch(err => {
      return nodeErr.repeat(err, { name: 'FETCH_USER' }); // this will reject again
    })
}
```

<br>

You can also force an error report on a silent/custom error, so it will still show in the logs:

> `nodeErr.repeat('It failed!', true)(err);`

<br>


## Examples<a name="examples"></a>

**Viewing the Examples**

There are several examples included in the project. To run these...

1. `$ cd examples`
2. `$ npm install`
3. `$ npm run start`
4. Navigate to `http://localhost:5000` for a directory of examples.

