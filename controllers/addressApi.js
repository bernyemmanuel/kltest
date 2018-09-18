'use strict';

const models = require('../models');
const async = require('async');

export default class AddressCtrl {
    constructor() {}

    getAllCountries(req, res) {
        models.countries
            .findAll({
                where: {
                    short_name: {
                        $in: ['IND', 'USA']
                    }
                }
            })
            .then(e => {
                sendResponse(res, null, e);
            });
    }

    getStates(req, res) {
        let country_id = req.params.country_id;
        if (!country_id) {
            sendResponse(res, 'custom', { message: 'Country missing' });
            return;
        }
        models.states
            .findAll({
                where: {
                    country_id: country_id
                }
            })
            .then(e => {
                sendResponse(res, null, e);
            });
    }
}
