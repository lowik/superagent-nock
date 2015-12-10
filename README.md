# superagent-nock
Very simple mock of superagent http requests for testing purpose (from Node.js or the browser)
Inspired by superagent-mocker, superagent-mock and nock

Used for testing React components with Redux and Observable

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
Mock the url
```js
nock.get('/events/10')
```
Define result
```js
nock.reply(httpStatus, responseBody)
```

Then, when you do GET request on the url, the callback return the specified response
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
