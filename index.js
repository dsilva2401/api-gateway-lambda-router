"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRouter = void 0;
class EventRouter {
    constructor(params) {
        this.parsedRoutes = params.routes.map(route => this.parseRoute(route));
        this.defaultHandler = params.defaultHandler;
    }
    parseRoute(route) {
        let variablesMap = {};
        let parsedPath = route.path.split('/').map((segment, idx) => {
            if (segment[0] !== ':') {
                return segment;
            }
            const varKey = segment.replace(':', '');
            variablesMap[varKey] = idx;
            return '[a-zA-Z0-9\_]+';
        }).join('/') + (route.strictPath ? '$' : '');
        let parsedRoute = {
            ...route,
            pathRegExp: new RegExp(parsedPath, 'i'),
            pathVariablesMap: variablesMap,
        };
        return parsedRoute;
    }
    eventHandler(event) {
        return new Promise((resolve, reject) => {
            const requestData = {
                method: event.requestContext.http.method,
                path: event.requestContext.http.path,
                headers: event.headers,
                queryParameters: event.queryStringParameters,
                pathParameters: {},
                body: (() => {
                    try {
                        return JSON.parse(event.body);
                    }
                    catch (err) {
                        return event.body;
                    }
                })(),
            };
            const responseHandler = (responseParams) => {
                resolve({
                    statusCode: responseParams.status || 200,
                    body: (responseParams.data && typeof responseParams.data === 'object') ? JSON.stringify(responseParams.data) : responseParams.data,
                    headers: responseParams.headers || {},
                });
            };
            const matchingRouter = this.parsedRoutes
                .filter(route => (event.requestContext.http.path.match(route.pathRegExp) &&
                (event.requestContext.http.method === route.method || route.method === 'ANY')))[0];
            if (!matchingRouter) {
                this.defaultHandler(requestData, responseHandler);
            }
            const pathSegments = event.requestContext.http.path.split('/');
            let pathParameters = {};
            Object.keys(matchingRouter.pathVariablesMap).forEach(k => {
                pathParameters[k] = pathSegments[matchingRouter.pathVariablesMap[k]];
            });
            requestData.pathParameters = pathParameters;
            matchingRouter.handler(requestData, responseHandler);
        });
    }
}
exports.EventRouter = EventRouter;
