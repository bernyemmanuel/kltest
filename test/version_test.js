const request = require('supertest');
const express = require('express');
const assert = require('assert');
const versionCtrl = require('../controllers/versionApi');

const app = express();

global.sendResponse = require('../helpers/common').sendAjaxResult;

app.get('/version', versionCtrl.getVersion);

describe('GET /version', () => {
    it('respond with json', done => {
        request(app)
            .get('/version')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                assert(response.body.data.version === '1.3.2');
                done();
            });
    });
});
