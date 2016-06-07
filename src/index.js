// TODO: unset

const methodsMapping = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	del: 'DELETE',
	patch: 'PATCH'
};

const mock = {};

// The base url
let baseUrl;

// Routes registry
let routesMap = {};

// The current (last defined) route
let currentRoute;

function buildRoute(method, url, reply) {
	return {
		method,
		url: baseUrl + url,
		reply
	};
}

function buildRouteKey(httpMethod, url) {
	return httpMethod + ' ' + url;
}

function addRoute(method, url) {
	const route = buildRoute(method, url);
	const routeKey = buildRouteKey(route.method, route.url);
	routesMap[routeKey] = route;
	currentRoute = route;
	return mock; // chaining
}

// TODO: mock.delay;

// Sugar methods to add routes by http methods
Object.keys(methodsMapping).forEach(method => {
	const httpMethod = methodsMapping[method];
	mock[method] = addRoute.bind(null, httpMethod);
});

// Reply function
mock.reply = (status, result) => {
	if (!currentRoute) {
		throw new Error('Must call get, post, put, del or patch before reply');
	}

	currentRoute.reply = {
		status,
		result
	};

	return mock; // chaining
};

mock.clear = () => {
	routesMap = {};
	return mock; // chaining
};

function init(requestBaseUrl = '') {
	baseUrl = requestBaseUrl; // Set the baseUrl
	return mock;
}

export default function(superagent) {
	// don't patch if superagent was patched already
	if (superagent._patchedBySuperagentMocker) {
		return init;
	}

	superagent._patchedBySuperagentMocker = true;

	// Patch the end method to shallow the request and return the result
	const reqProto = superagent.Request.prototype;
	const oldEnd = reqProto.end;
	reqProto.end = function end(cb) { // do not use function arrow to access to this.url and this.method
		const route = routesMap[buildRouteKey(this.method, this.url)];
		const reply = route && route.reply;
		if (reply) {
			let err;
			let res;
			if (reply.status >= 400) {
				err = {
					status: reply.status,
					response: reply.result
				};
			} else {
				res = {
                    status: reply.status,
					body: reply.result
				};
			}

			try {
				cb && cb(err, res);
			} catch (e) {
				console.error('callback error', e.stack || e);
				const response = new superagent.Response({
					res: {
						headers: {},
						setEncoding: () => {},
						on: () => {}
					},
					req: {
						method: () => {}
					},
					xhr: {
						responseType: '',
						getAllResponseHeaders: () => 'a header',
						getResponseHeader: () => 'a header'
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
}
