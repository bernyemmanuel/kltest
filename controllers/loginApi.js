'user strict';

import Nexmo from 'nexmo';
import jwt from 'jsonwebtoken';
import {
    LoginRequest as LoginRequestSchema,
    LoginVerification as LoginVerificationSchema
} from '../helpers/requestSchemas';

const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
});

const insertRequestIdAndSendResponse = (obj, conn, res) => {
    conn.query(
        `INSERT INTO verification_request (mobile_number, request_id) VALUES(${
            obj.mobile_number
        }, '${obj.request_id}') ON DUPLICATE KEY UPDATE request_id='${
            obj.request_id
        }'`,
        (err, results, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else {
                const responseObj = {
                    new_user: obj.new_user,
                    request_id: obj.request_id,
                    mobile_number: obj.mobile_number
                };
                sendResponse(res, null, responseObj, conn);
            }
        }
    );
};

const alphanumericUnique = () =>
    Math.random()
        .toString(36)
        .split('')
        .filter((value, index, self) => self.indexOf(value) === index)
        .join('')
        .substr(2, 6);

const sendNexmoVerificationRequest = (obj, conn, res, newUser) => {
    nexmo.verify.request(
        {
            number: obj.country_code + obj.mobile_number,
            brand: 'Kalhatti',
            code_length: 6
        },
        (p, responseNexmo) => {
            if (
                responseNexmo.error_text !== null &&
                typeof responseNexmo.error_text !== 'undefined' &&
                responseNexmo.status !== '10'
            ) {
                if (responseNexmo.status === '3') {
                    sendResponse(
                        res,
                        { code: 1008, message: 'Invalid mobile number' },
                        null,
                        conn
                    );
                } else {
                    sendResponse(
                        res,
                        {
                            code: 1007,
                            message: 'Not able to send SMS. Pls try again'
                        },
                        null,
                        conn
                    );
                }
            } else {
                const paramObj = {
                    new_user: newUser,
                    request_id: responseNexmo.request_id,
                    mobile_number: obj.mobile_number
                };
                insertRequestIdAndSendResponse(paramObj, conn, res);
            }
        }
    );
};
const checkRegisterUser = (obj, conn, res) => {
    conn.query(
        'INSERT INTO `users` (`mobile_number`, `country_code`,`device_type`,`device_id`,`referal_code`) VALUES (?,?,?,?,?)',
        [
            obj.mobile_number,
            obj.country_code,
            obj.device_type,
            obj.device_id,
            `ku-${alphanumericUnique()}`
        ],
        (err, results, fields) => {
            if (!err || err.code === 'ER_DUP_ENTRY') {
                const newUser = !err;
                sendNexmoVerificationRequest(obj, conn, res, newUser);
            } else {
                // something else happened throw internal error
                sendResponse(res, 'mysql_query_error', null, conn);
            }
        }
    );
};

const sendAccessTokenAndUid = (obj, conn, res) => {
    conn.query(
        `SELECT u.uid, u.email_id
    from users u 
    where mobile_number=${obj.mobile_number}`,
        (err, rows, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else {
                // generate JWT token
                const uid = rows[0].uid;
                const accessToken = jwt.sign({ uid }, process.env.JWT_KEY, {
                    expiresIn: '60d'
                });
                sendResponse(
                    res,
                    null,
                    {
                        uid,
                        access_token: accessToken,
                        email_id: rows[0].email_id
                    },
                    conn
                );
            }
        }
    );
};

const sendNexmoVerificationCheck = (obj, conn, res) => {
    nexmo.verify.check(
        { request_id: obj.request_id, code: obj.code },
        (p, nexmoResponse) => {
            if (
                nexmoResponse.error_text !== null &&
                typeof nexmoResponse.error_text !== 'undefined'
            ) {
                if (nexmoResponse.status === '16') {
                    sendResponse(res, 'invalid_code', null, conn);
                } else {
                    sendResponse(
                        res,
                        'invalid_verification_request',
                        null,
                        conn
                    );
                }
            } else if (nexmoResponse.status === '0') {
                conn.query(
                    `DELETE from verification_request where request_id='${
                        obj.request_id
                    }' and mobile_number=${obj.mobile_number};`
                );
                if (obj.new_user) {
                    conn.query(
                        `UPDATE users set status = 1 where mobile_number = ${
                            obj.mobile_number
                        }`,
                        (err, rows, fields) => {
                            if (err)
                                sendResponse(
                                    res,
                                    'mysql_query_error',
                                    null,
                                    conn
                                );
                            else sendAccessTokenAndUid(obj, conn, res);
                        }
                    );
                } else {
                    sendAccessTokenAndUid(obj, conn, res);
                }
            } else {
                sendResponse(res, 'invalid_verification_request', null, conn);
            }
        }
    );
};

const checkRequestIdAndMobile = (obj, conn, res) => {
    conn.query(
        `SELECT count(*) as requestCount from verification_request where request_id='${
            obj.request_id
        }' and mobile_number=${obj.mobile_number};`,
        (err, rows, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else if (rows[0].requestCount !== 1) {
                sendResponse(res, 'invalid_verification_request', null, conn);
            } else {
                // send request to nexmo to verify.
                sendNexmoVerificationCheck(obj, conn, res);
            }
        }
    );
};

exports.loginRequest = (req, res) => {
    validateParams(req.body, LoginRequestSchema)
        .then(() => {
            const conn = mysql.create();
            connectMysql(conn)
                .then(() => {
                    checkRegisterUser(req.body, conn, res);
                })
                .catch(() => {
                    sendResponse(res, 'mysql_connection_error');
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.loginVerify = (req, res) => {
    validateParams(req.body, LoginVerificationSchema)
        .then(() => {
            const conn = mysql.create();
            connectMysql(conn)
                .then(() => {
                    checkRequestIdAndMobile(req.body, conn, res);
                })
                .catch(() => {
                    sendResponse(res, 'mysql_connection_error');
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};
