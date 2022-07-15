# API Gateway Lambda Router

Use this router to manage your routes in AWS Lambda and API Gateway.

## Usage

> To be able to use this router create a route in API Gateway (API Type: `HTTP API`) wuth the path `/{path+}` and method `ANY`.

Usage example:

```javascript
import { EventRouter } from 'api-gateway-lambda-router';

const router = new EventRouter({
  defaultHandler: async (requestData, response) => {
    response({
      status: 404,
      data: 'Not found :('
    })
  },
  routes: [
    {
      path: '/hi/:name',
      method: 'GET',
      handler: async (requestData, response) => {
        response({
          data: {
            hello: requestData.pathParameters.name  
          }
        })
      }
    },
  ]
});

export async function handler (event: any) {
  return await router.eventHandler(event);
}
```