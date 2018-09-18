import { SupportMessage as SupportMessageSchema } from '../helpers/requestSchemas';
const models = require('../models');
import { sendSupportEmail } from './mailApi';

exports.supportMessage = (req, res) => {
    validateParams(req.body, SupportMessageSchema)
        .then(() => {
            let data = {
                uid: req.headers.uid,
                message: req.body.message,
                type: req.body.type,
                status: 0
            };
            models.support_requests
                .create(data)
                .then(result => {
                    models.users.findById(req.headers.uid).then(_user => {
                        sendSupportEmail(_user, result);
                        sendResponse(res);
                    });
                })
                .catch(err => {
                    sendResponse(res, 'custom', { code: 400, message: err });
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};
