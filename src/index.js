const mock = {};

// The base url
let baseUrl;

// Routes registry
let routesMap = {};

// The current (last defined) route
let currentRoute;

const methodsMapping = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	del: 'DELETE',
	patch: 'PATCH',
	head: 'HEAD',
};

const isFunction = obj => !!(obj && obj.constructor && obj.call && obj.apply);

const buildRoute = (method, url, reply) => ({
	method,
	url: `${baseUrl}${url}`,
	reply,
});

const buildRouteKey = (httpMethod, url) => `${httpMethod} ${url}`;

const addRoute = (method, url) => {
	const route = buildRoute(method, url);
	const routeKey = buildRouteKey(route.method, route.url);
	routesMap[routeKey] = route;
	currentRoute = route;
	return mock; // for chaining
};

// TODO: mock.delay;

// Sugar methods to add routes by http methods
Object.keys(methodsMapping).forEach(method => {
	const httpMethod = methodsMapping[method];
	mock[method] = addRoute.bind(null, httpMethod);
});

// Reply function
mock.reply = (status, result, headers, ...rest) => {
	if (!currentRoute) {
		throw new Error('Must call get, post, put, del or patch before reply');
	}

	currentRoute.reply = {
		status,
		result,
		headers,
		...rest,
	};

	return mock; // chaining
};

mock.clear = () => {
	routesMap = {};
	return mock; // chaining
};

const init = (requestBaseUrl = '') => {
	baseUrl = requestBaseUrl; // Set the baseUrl
	return mock;
};

export default superagent => {
	// don't patch if superagent was patched already
	if (superagent._patchedBySuperagentMocker) {
		// mock.clear() // sheldon: added reset here
		return init;
	}

	superagent._patchedBySuperagentMocker = true;

	// Patch the end method to shallow the request and return the result
	const reqProto = superagent.Request.prototype;
	const oldEnd = reqProto.end;
	reqProto.end = function end(cb) { // do not use function arrow to access to this.url and this.method
		const route = routesMap[buildRouteKey(this.method, this.url)];
		let reply = route && route.reply;
		if (reply) {
			if (isFunction(reply.status)) {
				reply = reply.status(this.url) || {status: 500};
			}

			// sheldon: the correct superagent behavior is to have res even in error case
			const res = {
				status: reply.status,
				body: reply.result,
				headers: reply.headers,
				ok: true,
				...reply,
			};

			let err;
			if (reply.status >= 400) {
				err = {
					status: reply.status,
					response: reply.result,
					...reply,
				};
				res.ok = false;
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
};
