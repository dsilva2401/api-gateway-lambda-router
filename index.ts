export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY';

export interface RouteHandlerResponseParams {
  status?: number;
  data: any;
  headers?: { [key: string]: string };
}
export interface RouteHandlerResponse {
  (params: RouteHandlerResponseParams): any;
}

export interface RouteHandler {
  (request: RequestData, response: RouteHandlerResponse, next: Function): any;
}

export interface RequestData {
  method: RouteMethod;
  path: string;
  headers: any;
  queryParameters: { [key: string]: string };
  pathParameters: { [key: string]: string };
  body?: any;
}

export interface Route {
  strictPath?: boolean;
  path: string;
  method: RouteMethod;
  handler?: RouteHandler;
  handlers?: RouteHandler[];
}

export type RouteHandlerOneOrList = RouteHandler | RouteHandler[];

export interface ParsedRoute extends Route {
  pathRegExp: RegExp;
  pathVariablesMap: any;
}

export interface EventRouterParams {
  defaultHandler: RouteHandler;
  routes: Route[];
}

export class EventRouter {

  private parsedRoutes: ParsedRoute[];

  private defaultHandler: RouteHandler;

  constructor (params: EventRouterParams) {
    this.parsedRoutes = params.routes.map(route => this.parseRoute(route));
    this.defaultHandler = params.defaultHandler;
  }

  private parseRoute (route: Route): ParsedRoute {
    let variablesMap: any = {}
    let parsedPath = route.path.split('/').map((segment, idx) => {
      if (segment[0] !== ':') {
        return segment;
      }
      const varKey = segment.replace(':', '');
      variablesMap[varKey] = idx;
      return '[a-zA-Z0-9\_]+';
    }).join('/')+(route.strictPath ? '$' : '');
    let parsedRoute: ParsedRoute = { 
      ...route, 
      pathRegExp: new RegExp(parsedPath, 'i'),
      pathVariablesMap: variablesMap,
    };
    return parsedRoute;
  }

  public eventHandler (event: any) {
    return new Promise((resolve) => {
      const requestData: RequestData = {
        method: event.requestContext.http.method,
        path: event.requestContext.http.path,
        headers: event.headers,
        queryParameters: event.queryStringParameters,
        pathParameters: {},
        body: (() => {
          try {
            return JSON.parse(event.body);
          } catch (err) {
            return event.body;
          }
        })(),
      }
      const responseHandler = (responseParams: RouteHandlerResponseParams) => {
        resolve({
          statusCode: responseParams.status || 200,
          body: (responseParams.data && typeof responseParams.data === 'object') ? JSON.stringify(responseParams.data) : responseParams.data,
          headers: responseParams.headers || {},
        })
      }
      const matchingRouter = this.parsedRoutes
        .filter(route => (
          event.requestContext.http.path.match(route.pathRegExp) &&
          (event.requestContext.http.method === route.method || route.method === 'ANY')
        ))[0];
      if (!matchingRouter) {
        this.defaultHandler(requestData, responseHandler, () => {});
      }
      const pathSegments = event.requestContext.http.path.split('/');
      let pathParameters: any = {}
      Object.keys(matchingRouter.pathVariablesMap).forEach(k => {
        pathParameters[k] = pathSegments[matchingRouter.pathVariablesMap[k]]
      })
      requestData.pathParameters = pathParameters;
      if (!!matchingRouter.handler) {
        matchingRouter.handler(requestData, responseHandler, () => {});
        return;
      }
      let handlers = (matchingRouter.handlers || []).slice();
      function executeHandlers () {
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
    })
  }

}

export class Router {

  private routes: Route[];

  constructor () {
    this.routes = [];
  }

  private addRoute (method: RouteMethod, path: string, handlerOrHandlers: RouteHandlerOneOrList ) {
    this.routes.push(
      Object.assign(
        {
          path: path,
          method: method,
        }, 
        Array.isArray(handlerOrHandlers) ? 
          { handlers: handlerOrHandlers } : 
          { handler: handlerOrHandlers }
        )
    );
  }

  public get (path: string, handlerOrHandlers: RouteHandlerOneOrList) {
    this.addRoute('GET', path, handlerOrHandlers);
  }

  public put (path: string, handlerOrHandlers: RouteHandlerOneOrList) {
    this.addRoute('PUT', path, handlerOrHandlers);
  }

  public post (path: string, handlerOrHandlers: RouteHandlerOneOrList) {
    this.addRoute('POST', path, handlerOrHandlers);
  }

  public delete (path: string, handlerOrHandlers: RouteHandlerOneOrList) {
    this.addRoute('DELETE', path, handlerOrHandlers);
  }

  public exportRoutes () {
    return this.routes;
  }

  public attachRouter (path: string, router: Router) {
    router.exportRoutes().forEach(route => {
      this.addRoute(route.method, `${path}${route.path}`, route.handler || route.handlers || [])
    })
  }

}