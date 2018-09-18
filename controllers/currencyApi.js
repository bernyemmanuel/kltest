const request = require('request');

export default class CyrrencyCtrl {
    constructor() {
        this.BASE_URL =
            'http://free.currencyconverterapi.com/api/v5/convert?q={{q}}&compact=ultra';
        this.request_options = {
            method: 'GET',
            url: '',
            headers: {
                'content-type': 'application/json',
                accept: 'application/json'
            }
        };
        this.key = null;
    }

    convert(req, res) {
        let options = Object.assign({}, this.request_options, {
            url: this.makeUrl(req.params),
            method: 'GET'
        });
        let self = this;
        request(options, (error, response, body) => {
            let d = JSON.parse(body);
            sendResponse(res, null, d[this.key]);
        });
    }

    makeUrl({ from, to }) {
        this.key = from.toUpperCase() + '_' + to.toUpperCase();
        return this.BASE_URL.replace('{{q}}', this.key);
    }
}
