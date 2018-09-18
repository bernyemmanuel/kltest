import { RedeemCode as RedeemCodeSchema } from '../helpers/requestSchemas';

const codeType = code => {
    const codeArr = code.split('-');
    if (codeArr.length > 1) {
        if (codeArr[0].toLowerCase() === 'kp') {
            return 'PROMO';
        } else if (codeArr[0].toLowerCase() === 'ku') {
            return 'REFER';
        }
    }
    return null;
};

const checkAndApplyReferCode = (req, res, conn) => {
    conn.query(
        `select uid from users where referal_code='${req.body.code}';
    select referrer_uid from users where uid = ${req.headers.uid};`,
        (err, rows, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else if (
                rows[1].length === 1 &&
                rows[1][0].referrer_uid != null
            ) {
                sendResponse(
                    res,
                    { code: 6001, message: 'Refer Code already applied' },
                    null,
                    conn
                );
            } else if (rows[0].length === 1) {
                const referrerUser = rows[0][0].uid;
                if (
                    parseInt(referrerUser, 10) !== parseInt(req.headers.uid, 10)
                ) {
                    conn.query(
                        `INSERT INTO user_wallet (uid, amount) VALUES(${
                            req.headers.uid
                        }, 5) ON DUPLICATE KEY UPDATE amount = amount+5;
           update users set referrer_uid = ${referrerUser}
           where uid = ${req.headers.uid};
           insert into user_promo_used (uid,promo_code,is_referal) values
           (${req.headers.uid},'${req.body.code}',1)
          `,
                        (errRef, rowsRef, fieldsRef) => {
                            if (errRef) {
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
                } else {
                    sendResponse(
                        res,
                        { code: 6000, message: 'Invalid Refer/Promo Code' },
                        null,
                        conn
                    );
                }
            } else {
                sendResponse(
                    res,
                    { code: 6000, message: 'Invalid Refer/Promo Code' },
                    null,
                    conn
                );
            }
        }
    );
};

const checkAndApplyPromoCode = (req, res, conn) => {
    conn.query(
        `select * from user_promo_used where uid = ${
            req.headers.uid
        } and promo_code = '${req.body.code.toLowerCase()}' and redeemed = 0`,
        (errUsr, rowsUsr, fieldsUsr) => {
            if (errUsr) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else if (rowsUsr.length === 0) {
                conn.query(
                    `update promo_codes set count = count -1 where code = '${
                        req.body.code
                    }';`,
                    (err, rows, fields) => {
                        if (!err && rows.affectedRows === 1) {
                            conn.query(
                                `insert into user_promo_used (uid,promo_code) values (${
                                    req.headers.uid
                                },'${req.body.code.toLowerCase()}')`
                            );
                            sendResponse(res, null, null, conn);
                        } else {
                            sendResponse(
                                res,
                                {
                                    code: 6002,
                                    message:
                                        'Not able to apply code, invalid code or limit exceeded'
                                },
                                null,
                                conn
                            );
                        }
                    }
                );
            } else {
                sendResponse(
                    res,
                    { code: 6003, message: 'Promo Already Used' },
                    null,
                    conn
                );
            }
        }
    );
};

exports.redeemCode = (req, res) => {
    validateParams(req.body, RedeemCodeSchema)
        .then(() => {
            // see if user referal or promo code
            const codeTyp = codeType(req.body.code);
            if (codeTyp) {
                const conn = mysql.create(true);
                connectMysql(conn)
                    .then(() => {
                        if (codeTyp === 'PROMO') {
                            checkAndApplyPromoCode(req, res, conn);
                        } else {
                            checkAndApplyReferCode(req, res, conn);
                        }
                    })
                    .catch(() => {
                        sendResponse(res, 'mysql_connection_error');
                    });
            } else {
                sendResponse(res, {
                    code: 6000,
                    message: 'Invalid Refer/Promo Code'
                });
            }
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.getUserCoupons = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select promo_code, is_referal from user_promo_used where uid = ${
                    req.headers.uid
                } and redeemed = 0 order by added_timestamp desc limit 1`,
                (err, rows, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else if (rows.length === 1) {
                        sendResponse(
                            res,
                            null,
                            {
                                promo_code: rows[0].promo_code,
                                isReferal: rows[0].is_referal
                            },
                            conn
                        );
                    } else {
                        sendResponse(
                            res,
                            null,
                            { promo_code: null, isReferal: 0 },
                            conn
                        );
                    }
                }
            );
        })
        .catch(() => {
            sendResponse(res, 'mysql_connection_error');
        });
};
