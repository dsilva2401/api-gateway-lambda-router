"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const router = new index_1.EventRouter({
    defaultHandler: async (requestData, response) => {
        response({
            status: 404,
            data: 'Not found :('
        });
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
                });
            }
        },
    ]
});
router.startLocalServer(3000);
