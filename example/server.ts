import { EventRouter } from '../index';

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
            hello: requestData
          }
        })
      }
    },
  ]
});

router.startLocalServer(3000);