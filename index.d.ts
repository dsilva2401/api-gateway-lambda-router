export declare type RouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY';
export interface RouteHandlerResponseParams {
    status?: number;
    data: any;
    headers?: {
        [key: string]: string;
    };
}
export interface RouteHandlerResponse {
    (params: RouteHandlerResponseParams): any;
}
export interface RouteHandler {
    (request: RequestData, response: RouteHandlerResponse): Promise<any>;
}
export interface RequestData {
    method: RouteMethod;
    path: string;
    headers: any;
    queryParameters: {
        [key: string]: string;
    };
    pathParameters: {
        [key: string]: string;
    };
    body?: any;
}
export interface Route {
    strictPath?: boolean;
    path: string;
    method: RouteMethod;
    handler: RouteHandler;
}
export interface ParsedRoute extends Route {
    pathRegExp: RegExp;
    pathVariablesMap: any;
}
export interface EventRouterParams {
    defaultHandler: RouteHandler;
    routes: Route[];
}
export declare class EventRouter {
    private parsedRoutes;
    private defaultHandler;
    constructor(params: EventRouterParams);
    private parseRoute;
    eventHandler(event: any): Promise<unknown>;
}
