'user strict';

import {
    BuyAsset as BuyAssetSchema,
    SellAsset as SellAssetSchema
} from '../helpers/requestSchemas';
import { CheckAsset, GetPricePerToken } from '../helpers/validators';

const processReferalPromo = (conn, code, uid) => {
    conn.query(
        `select uid from users where referal_code = '${code}'`,
        (err, rows, fields) => {
            if (!err && rows.length === 1) {
                conn.query(
                    `INSERT INTO user_wallet (uid, amount) VALUES(${
                        rows[0].uid
                    }, 5) ON DUPLICATE KEY UPDATE amount = amount+5;`
                );
                conn.end();
            }
        }
    );
};

const processPromo = (conn, code, uid, amount) => {
    conn.query(
        `select amount_precentage,max_amount,promo_type from promo_codes where code = '${code}'`,
        (err, rows, fields) => {
            if (!err && rows.length === 1) {
                if (rows[0].promo_type === 1) {
                    // cashback
                    let casbackamount = rows[0].amount_precentage * amount;
                    if (casbackamount > rows[0].max_amount) {
                        casbackamount = rows[0].max_amount;
                    }
                    conn.query(
                        `INSERT INTO user_wallet (uid, amount) VALUES(${uid}, ${casbackamount}) ON DUPLICATE KEY UPDATE amount = amount+${casbackamount};`
                    );
                    conn.end();
                }
            }
        }
    );
};

const checkPromoAndCredit = (uid, amount) => {
    const conn = mysql.create();
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select promo_code, is_referal from user_promo_used where uid = ${uid} and redeemed = 0
        order by added_timestamp desc limit 1`,
                (err, rows, fields) => {
                    if (!err && rows.length === 1) {
                        // some promo is applied
                        conn.query(
                            `update user_promo_used set redeemed = 1 where uid = ${uid} and promo_code = '${
                                rows[0].promo_code
                            }'`
                        );
                        if (rows[0].is_referal === 1) {
                            // referal type
                            processReferalPromo(conn, rows[0].promo_code, uid);
                        } else {
                            processPromo(conn, rows[0].promo_code, uid, amount);
                        }
                    }
                }
            );
        })
        .catch(err => {});
};
const deductFromWallet = (uid, amount, conn) =>
    new Promise((resolve, reject) => {
        conn.query(
            `select amount from user_wallet where  uid = ${uid}`,
            (err, rows, fields) => {
                if (err) {
                    reject();
                } else if (
                    rows.length === 1 &&
                    parseFloat(rows[0].amount) >= parseFloat(amount)
                ) {
                    conn.query(
                        `update user_wallet set amount = GREATEST(amount - ${amount},0) where uid = ${uid}`,
                        (errUp, rowsUp, fieldsUp) => {
                            if (errUp) {
                                reject();
                            } else {
                                resolve();
                            }
                        }
                    );
                } else {
                    reject();
                }
            }
        );
    });

const makeTransaction = (
    req,
    res,
    conn,
    quantity,
    amount,
    transactionType,
    walletAmount,
    paymentMethodVal,
    paymentMethodCol,
    updateCondition,
    pricePerToken,
    isBuy
) => {
    conn.query(
        `INSERT into user_asset_transactions(uid,asset_id,asset_quantity,amount,transaction_type,amount_from_wallet,price_per_asset ${paymentMethodCol}) values(${
            req.headers.uid
        },${
            req.body.asset_id
        },${quantity},${amount},'${transactionType}',${walletAmount},${pricePerToken} ${paymentMethodVal})`,
        (err, results, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else {
                const walletQuery = isBuy
                    ? ''
                    : `INSERT INTO user_wallet (uid, amount) VALUES(${
                          req.headers.uid
                      }, 
                        ${amount}) ON DUPLICATE KEY UPDATE amount = amount+${amount}`;
                conn.query(
                    `INSERT into user_assets(uid,asset_id,quantity) values (${
                        req.headers.uid
                    },${
                        req.body.asset_id
                    },${quantity}) ON DUPLICATE KEY UPDATE ${updateCondition};${walletQuery} `,
                    (errAssetUpdate, resultsAssetUpdate, fieldsAssetUpdate) => {
                        if (errAssetUpdate) {
                            sendResponse(
                                res,
                                {
                                    code: 3003,
                                    message: 'Not able to complete transaction'
                                },
                                null,
                                conn
                            );
                        } else {
                            sendResponse(res, null, null, conn);
                            checkPromoAndCredit(
                                req.headers.uid,
                                amount - walletAmount
                            );
                        }
                    }
                );
            }
        }
    );
};
const processBuySell = (req, res, isBuy, conn) => {
    GetPricePerToken(req.body.asset_id, conn)
        .then(pricePerToken => {
            let quantity = 0;
            let amount = 0;
            let updateCondition = '';
            let walletAmount = 0;
            if (isBuy) {
                amount = req.body.amount;
                walletAmount = req.body.wallet_amount;
                quantity = (req.body.amount / pricePerToken).toFixed(3);
                updateCondition = `quantity = quantity+${quantity}`;
                // TODO: user payable amount to payment gateway
                // payableAmount = req.body.amount - req.body.wallet_amount;
            } else {
                quantity = req.body.quantity;
                amount = req.body.quantity * pricePerToken;
                updateCondition = `quantity = quantity-${quantity}`;
            }

            const transactionType = isBuy ? 'BUY' : 'SELL';
            const paymentMethodCol = isBuy ? ',payment_method' : '';
            const paymentMethodVal = isBuy
                ? `,'${req.body.payment_method}'`
                : '';
            if (walletAmount > 0) {
                deductFromWallet(req.headers.uid, walletAmount, conn)
                    .then(() => {
                        makeTransaction(
                            req,
                            res,
                            conn,
                            quantity,
                            amount,
                            transactionType,
                            walletAmount,
                            paymentMethodVal,
                            paymentMethodCol,
                            updateCondition,
                            pricePerToken,
                            isBuy
                        );
                        return null;
                    })
                    .catch(err => {
                        sendResponse(
                            res,
                            {
                                code: 3003,
                                message: 'Not able to complete transaction'
                            },
                            null,
                            conn
                        );
                    });
            } else {
                makeTransaction(
                    req,
                    res,
                    conn,
                    quantity,
                    amount,
                    transactionType,
                    walletAmount,
                    paymentMethodVal,
                    paymentMethodCol,
                    updateCondition,
                    pricePerToken,
                    isBuy
                );
            }
        })
        .catch(() => {
            sendResponse(
                res,
                { code: 3003, message: 'Not able to complete transaction' },
                null,
                conn
            );
        });
};

const checkAvailableQuantityWithUser = (req, res, conn) => {
    conn.query(
        `select quantity from user_assets where uid = ${
            req.headers.uid
        } and asset_id = ${req.body.asset_id}`,
        (err, results, fields) => {
            if (err) {
                sendResponse(res, 'mysql_query_error', null, conn);
            } else if (results.length === 1) {
                if (results[0].quantity >= req.body.quantity) {
                    processBuySell(req, res, false, conn);
                } else {
                    sendResponse(
                        res,
                        {
                            code: 3005,
                            message: 'Not sufficent quanity to sell'
                        },
                        null,
                        conn
                    );
                }
            } else {
                sendResponse(
                    res,
                    { code: 3004, message: 'Asset is not Bought' },
                    null,
                    conn
                );
            }
        }
    );
};

const intitateBuySell = (req, res, isBuy) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            CheckAsset(req.body.asset_id, conn)
                .then(() => {
                    if (isBuy) processBuySell(req, res, isBuy, conn);
                    else checkAvailableQuantityWithUser(req, res, conn);
                    return null;
                })
                .catch(err => {
                    sendResponse(res, err, null, conn);
                });
            return null;
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};

exports.buyAsset = (req, res) => {
    validateParams(req.body, BuyAssetSchema)
        .then(() => {
            intitateBuySell(req, res, true);
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.sellAsset = (req, res) => {
    validateParams(req.body, SellAssetSchema)
        .then(() => {
            intitateBuySell(req, res, false);
            return null;
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};

exports.getTransactions = (req, res) => {
    const conn = mysql.create();
    connectMysql(conn)
        .then(() => {
            let whereCond = '';
            if (
                req.query != null &&
                req.query.asset_id != null &&
                req.query.asset_id !== ''
            ) {
                whereCond = ` and uat.asset_id = ${parseInt(
                    req.query.asset_id,
                    10
                )}`;
            }
            conn.query(
                `select uat.id as transaction_id, uat.amount, uat.transaction_type, uat.payment_method,
         uat.timestamp, a.name as asset_name, a.id as asset_id, a.icon as asset_icon, a.symbol, a.market_value, a.perc_change
         from user_asset_transactions uat join assets a on a.id = uat.asset_id where
         uat.uid = ${req.headers.uid} ${whereCond}`,
                (err, rows, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else if (rows.length > 0) {
                        sendResponse(res, null, { transactions: rows }, conn);
                    } else {
                        sendResponse(res, null, { transactions: [] }, conn);
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'invalid_params');
        });
};
