'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (superagent) {

	// don't patch if superagent was patched already
	if (superagent._patchedBySuperagentMocker) {
		// mock.clear() // sheldon: added reset here
		return init;
	}

	superagent._patchedBySuperagentMocker = true;

	// Patch the end method to shallow the request and return the result
	var reqProto = superagent.Request.prototype;
	var oldEnd = reqProto.end;
	reqProto.end = function end(cb) {
		// do not use function arrow to access to this.url and this.method
		var route = routesMap[buildRouteKey(this.method, this.url)];
		var reply = route && route.reply;
		if (reply) {
			if (isFunction(reply.status)) {
				reply = reply.status(this.url) || { status: 500 };
			}

			var err = void 0;
			var res = void 0;
			if (reply.status >= 400) {
				err = {
					status: reply.status,
					response: reply.result
				};
			}

			// sheldon: the correct superagent behavior is to have res even in error case
			res = {
				status: reply.status,
				body: reply.result
			};

			try {
				cb && cb(err, res);
			} catch (e) {
				console.error('callback error', e.stack || e);
				var response = new superagent.Response({
					res: {
						headers: {},
						setEncoding: function setEncoding() {},
						on: function on() {}
					},
					req: {
						method: function method() {}
					},
					xhr: {
						responseType: '',
						getAllResponseHeaders: function getAllResponseHeaders() {
							return 'a header';
						},
						getResponseHeader: function getResponseHeader() {
							return 'a header';
						}
					}
				});
				response.setStatusProperties(e.message);
				cb && cb(e, response);
			}

			/* TODO: delay: setTimeout(function() {
    try {
    cb && cb(null, current(state.request));
    } catch (ex) {
    cb && cb(ex, null);
    }
    }, value(mock.responseDelay));*/
		} else {
			oldEnd.call(this, cb);
		}
	};

	return init;
};

var methodsMapping = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	del: 'DELETE',
	patch: 'PATCH'
};

function isFunction(obj) {
	return !!(obj && obj.constructor && obj.call && obj.apply);
};

var mock = {};

// The base url
var baseUrl = void 0;

// Routes registry
var routesMap = {};

// The current (last defined) route
var currentRoute = void 0;

function buildRoute(method, url, reply) {
	return {
		method: method,
		url: baseUrl + url,
		reply: reply
	};
}

function buildRouteKey(httpMethod, url) {
	return httpMethod + ' ' + url;
}

function addRoute(method, url) {
	var route = buildRoute(method, url);
	var routeKey = buildRouteKey(route.method, route.url);
	routesMap[routeKey] = route;
	currentRoute = route;
	return mock; // chaining
}

// TODO: mock.delay;

// Sugar methods to add routes by http methods
Object.keys(methodsMapping).forEach(function (method) {
	var httpMethod = methodsMapping[method];
	mock[method] = addRoute.bind(null, httpMethod);
});

// Reply function
mock.reply = function (status, result) {
	if (!currentRoute) {
		throw new Error('Must call get, post, put, del or patch before reply');
	}

	currentRoute.reply = {
		status: status,
		result: result
	};

	return mock; // chaining
};

mock.clear = function () {
	routesMap = {};
	return mock; // chaining
};

function init() {
	var requestBaseUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

	baseUrl = requestBaseUrl; // Set the baseUrl
	return mock;
}