# superagent-nock
Very simple mock of superagent http requests for testing purpose (from Node.js or the browser).
Inspired by superagent-mocker, superagent-mock and nock.

Used for testing React components with Redux and Observable.

# Usage

## Setup
```js
import request from 'superagent';
import nocker from 'superagent-nock';
const nock = nocker(request);
```

## Use

Define the base url
```js
nock('http://localhost')
```
The url to mock
```js
nock.get('/events/10')
```
The result to return
```js
nock.reply(httpStatus, responseBody, responseHeaders)
```
or specify a function
```js
nock.reply(function() {
   return {
      status: 200,
      result: responseBody,
      headers: {'access-token': 'example-JSON-Web-Token'}
   };
})
```

Then, when you do a get request on the url, the callback return the specified result
```js
nock('http://localhost')
   .get('/events/10')
   .reply(200, {
    	id: 10,
      title: 'My event'
   });

request
   .get('http://localhost/events/10')
   .end((err, res) => {
      console.log(res.body); // { id: 10, title: 'My event'}
   };
```

## Chaining

You can chain your urls to mock:
```js
nock('http://localhost')
   .get('/events/10')
   .reply(200, {
	    id: 10,
	    title: 'My event'
   })
	 .get('/members/1')
   .reply(404);
```

# Install

You should probably install it in devDependencies (-D)
```sh
$ npm i -D superagent-nock
```

# Next TODO

nock.delay
nock.query
