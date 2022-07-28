"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.EventRouter = void 0;
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
        return new Promise((resolve) => {
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
                this.defaultHandler(requestData, responseHandler, () => { });
            }
            const pathSegments = event.requestContext.http.path.split('/');
            let pathParameters = {};
            Object.keys(matchingRouter.pathVariablesMap).forEach(k => {
                pathParameters[k] = pathSegments[matchingRouter.pathVariablesMap[k]];
            });
            requestData.pathParameters = pathParameters;
            if (!!matchingRouter.handler) {
                matchingRouter.handler(requestData, responseHandler, () => { });
                return;
            }
            let handlers = (matchingRouter.handlers || []).slice();
            function executeHandlers() {
                const buffHandler = handlers.shift();
                if (!buffHandler) {
                    responseHandler({ status: 200, data: '' });
                    return;
                }
                buffHandler(requestData, responseHandler, () => {
                    executeHandlers();
                });
            }
            executeHandlers();
        });
    }
}
exports.EventRouter = EventRouter;
class Router {
    constructor() {
        this.routes = [];
    }
    addRoute(method, path, handlerOrHandlers) {
        this.routes.push(Object.assign({
            path: path,
            method: method,
        }, Array.isArray(handlerOrHandlers) ?
            { handlers: handlerOrHandlers } :
            { handler: handlerOrHandlers }));
    }
    get(path, handlerOrHandlers) {
        this.addRoute('GET', path, handlerOrHandlers);
    }
    put(path, handlerOrHandlers) {
        this.addRoute('PUT', path, handlerOrHandlers);
    }
    post(path, handlerOrHandlers) {
        this.addRoute('POST', path, handlerOrHandlers);
    }
    delete(path, handlerOrHandlers) {
        this.addRoute('DELETE', path, handlerOrHandlers);
    }
    exportRoutes() {
        return this.routes;
    }
    attachRouter(path, router) {
        router.exportRoutes().forEach(route => {
            this.addRoute(route.method, `${path}${route.path}`, route.handler || route.handlers || []);
        });
    }
}
exports.Router = Router;
