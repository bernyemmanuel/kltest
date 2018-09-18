import {
    UpdateEmail as UpdateEmailSchema,
    UpdateUserDetails as UpdateUserDetailsSchema,
    PassCode as PassCodeSchema,
    ResetCode as ResetCodeSchema
} from '../helpers/requestSchemas';

const models = require('../models');

const updateNameAndEmail = (obj, conn, res) => {
    conn.query(
        `UPDATE users set first_name = '${obj.first_name}',
        last_name = '${obj.last_name}',
        email_id = '${obj.email_id}'
        where uid = ${obj.uid}`,
        (err, rows, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else {
                sendResponse(res, null, null, conn);
            }
        }
    );
};

const checkDuplicateEmail = (obj, conn, res) => {
    conn.query(
        `SELECT count(*) as emailCount from users where email_id='${
            obj.email_id
        }';`,
        (err, rows, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else if (rows[0].emailCount !== 0) {
                sendResponse(
                    res,
                    { code: 4001, message: 'Email Id Already Exisit' },
                    null,
                    conn
                );
            } else {
                // update email address
                updateNameAndEmail(obj, conn, res);
            }
        }
    );
};

exports.addToWaitlist = (req, res) => {
    let params = req.params;
    let uid = req.headers.uid;
    console.log('addToWaitlist', uid);
    models.invite_code_waitlist
        .findOrCreate({
            where: {
                user_uid: uid
            },
            defaults: {
                user_uid: uid
            }
        })
        .spread((result, is_new_record) => {
            res.send({ result, is_new_record });
        })
        .catch(error => {
            res.send({ error });
        });
};

exports.updateUser = (req, res) => {
    validateParams(req.body, UpdateEmailSchema)
        .then(() => {
            const conn = mysql.create();
            connectMysql(conn)
                .then(() => {
                    checkDuplicateEmail(
                        {
                            first_name: req.body.first_name,
                            last_name: req.body.last_name,
                            email_id: req.body.email_id,
                            uid: req.headers.uid
                        },
                        conn,
                        res
                    );
                })
                .catch(err => {
                    sendResponse(res, 'mysql_connection_error');
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.getDetails = (req, res) => {
    const conn = mysql.create();
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select mobile_number, email_id, status, first_name, last_name, dw_user_id, dw_account_id from users where uid =${
                    req.headers.uid
                }`,
                (err, rows, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        sendResponse(
                            res,
                            null,
                            { user_details: rows[0] },
                            conn
                        );
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};

exports.updateDetails = (req, res) => {
    validateParams(req.body, UpdateUserDetailsSchema)
        .then(() => {
            /*
          {
            first_name: data.first_name,
            last_name: data.last_name,
            dw_user_id: data.dw_user_id,
            dw_account_id: data.dw_account_id
          }
           */
            let data = Object.assign({}, req.body); // req.body;
            models.users
                .update(data, { where: { uid: req.headers.uid } })
                .then(e => {
                    sendResponse(res);
                })
                .catch(e => {
                    sendResponse(res, 'custom', { code: 400, message: e });
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.setPasscode = (req, res) => {
    validateParams(req.body, PassCodeSchema)
        .then(() => {
            const conn = mysql.create();
            connectMysql(conn)
                .then(() => {
                    conn.query(
                        `update users set passcode = '${
                            req.body.code
                        }' where uid = ${req.headers.uid}`,
                        (err, rows, fields) => {
                            if (err) {
                                sendResponse(
                                    res,
                                    'mysql_query_error',
                                    null,
                                    conn
                                );
                            } else {
                                sendResponse(res, null, null, conn);
                            }
                        }
                    );
                })
                .catch(err => {
                    sendResponse(res, 'mysql_connection_error');
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.resetPasscode = (req, res) => {
    validateParams(req.body, ResetCodeSchema)
        .then(() => {
            const conn = mysql.create();
            connectMysql(conn)
                .then(() => {
                    conn.query(
                        `select count(*) as count from users where passcode = '${
                            req.body.curr_code
                        }' and uid = ${req.headers.uid}`,
                        (err, rows, fields) => {
                            if (err) {
                                sendResponse(
                                    res,
                                    'mysql_query_error',
                                    null,
                                    conn
                                );
                            } else if (rows[0].count === 1) {
                                conn.query(
                                    `update users set passcode = '${
                                        req.body.new_code
                                    }' where uid = ${req.headers.uid}`,
                                    (errUpd, rowsUpd, fieldsUpd) => {
                                        if (errUpd) {
                                            sendResponse(
                                                res,
                                                'mysql_query_error',
                                                null,
                                                conn
                                            );
                                        } else if (rowsUpd.affectedRows === 1) {
                                            sendResponse(res, null, null, conn);
                                        } else {
                                            sendResponse(res, {
                                                code: 1006,
                                                message:
                                                    'Not able to update passcode, pls try again.'
                                            });
                                        }
                                    }
                                );
                            } else {
                                sendResponse(
                                    res,
                                    {
                                        code: 1005,
                                        message: 'Invalid Current passcode'
                                    },
                                    null,
                                    conn
                                );
                            }
                        }
                    );
                })
                .catch(err => {
                    sendResponse(res, 'mysql_connection_error');
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};
