const request = require('request');

exports.send = (endPoint, paramObj) =>
    new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            url: `http://api.drivewealth.io/v1/${endPoint}`,
            qs: paramObj,
            headers: {
                'postman-token': 'e01ad7ce-9a36-b77a-5a02-d27c5438d727',
                'cache-control': 'no-cache',
                'x-mysolomeo-session-key':
                    '5839940b-751e-4275-af11-7cb8d45a11cf.2017-10-13T22:31:29.849Z',
                'content-type': 'application/json',
                accept: 'application/json'
            }
        };

        request(options, (error, response, body) => {
            if (error) reject(error);
            else resolve(JSON.parse(body));
        });
    });
