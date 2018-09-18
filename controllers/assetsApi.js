'user strict';

import { FollowUnfollowAsset as FollowUnfollowAssetSchema } from '../helpers/requestSchemas';
import { CheckAsset } from '../helpers/validators';
const models = require('../models');

const DEFAULT_PAGE_SIZE = 20;

const asset_params = `a.id as asset_id,
                      a.name as asset_name,
                      a.symbol,
                      ROUND(a.market_value, 2) as open,
                      ROUND(a.high, 2) as high,
                      ROUND(a.low, 2) as low,
                      ROUND(a.close, 2) as close,
                      ROUND(a.volume, 2) as volume,
                      a.description,
                      ROUND(a.perc_change, 2) as perc_change,
                      ROUND(a.price_diff, 2) as price_diff,
                      a.asset_category_id`;

const checkFollowedUnfollowed = (assetId, userId, conn, isFollow) =>
    new Promise((resolve, reject) => {
        conn.query(
            `select count(*) as count from user_followed_assets where asset_id=${assetId} and uid =${userId}`,
            (err, results, fields) => {
                if (err) {
                    reject('mysql');
                } else if (results[0].count === 1 && isFollow) {
                    reject('already_followed');
                } else if (results[0].count === 0 && !isFollow) {
                    reject('not_followed');
                } else resolve();
            }
        );
    });

const followUnfollowAction = (assetId, userId, isFollow, res, conn) => {
    let query = '';
    if (isFollow) {
        query = `insert into user_followed_assets(uid,asset_id) values(${userId},${assetId});`;
    } else {
        query = `delete from user_followed_assets where uid = ${userId} and asset_id = ${assetId}`;
    }
    conn.query(query, (err, results, fields) => {
        if (err) sendResponse(res, 'mysql_query_error', null, conn);
        else sendResponse(res, null, null, conn);
    });
};

const followUnfollowAsset = (req, res, isFollow) => {
    validateParams(req.body, FollowUnfollowAssetSchema)
        .then(() => {
            const conn = mysql.create(true);
            connectMysql(conn)
                .then(() => {
                    CheckAsset(req.body.asset_id, conn)
                        .then(() => {
                            checkFollowedUnfollowed(
                                req.body.asset_id,
                                req.headers.uid,
                                conn,
                                isFollow
                            )
                                .then(() => {
                                    followUnfollowAction(
                                        req.body.asset_id,
                                        req.headers.uid,
                                        isFollow,
                                        res,
                                        conn
                                    );
                                })
                                .catch(err => {
                                    if (err === 'mysql') {
                                        sendResponse(
                                            res,
                                            'mysql_query_error',
                                            null,
                                            conn
                                        );
                                    } else {
                                        const message =
                                            err === 'already_followed'
                                                ? 'User is already following this asset'
                                                : 'User is not following this asset';
                                        const code =
                                            err === 'already_followed'
                                                ? 3003
                                                : 3004;
                                        sendResponse(
                                            res,
                                            { code, message },
                                            null,
                                            conn
                                        );
                                    }
                                });
                        })
                        .catch(err => {
                            sendResponse(res, err, null, conn);
                        });
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

exports.listAssets = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select ${asset_params}, false as asset_followed from assets a limit 0, 40;
        select asset_id,timestamp as date_watched from user_followed_assets
        where uid =${req.headers.uid};
        select
         ${asset_params},
        ap.label,ap.image as promoted_image,
        a.market_value from asset_promoted ap join assets a on a.id = ap.asset_id;
        `,
                (err, results, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        const assets = results[0];
                        if (results[1].length > 0) {
                            const followingAssetIds = [];
                            results[1].forEach(value =>
                                followingAssetIds.push(value.asset_id)
                            );
                            const randomNumber = Math.random();
                            const percentageChange =
                                randomNumber < 0.5
                                    ? Math.floor(randomNumber * -10)
                                    : Math.floor(randomNumber * 10);
                            for (let i = 0; i < assets.length; i += 1) {
                                if (
                                    followingAssetIds.indexOf(
                                        assets[i].asset_id
                                    ) !== -1
                                ) {
                                    assets[i].asset_followed = 1;
                                    assets[i].date_watched =
                                        results[1][
                                            followingAssetIds.indexOf(
                                                assets[i].asset_id
                                            )
                                        ].date_watched;
                                    assets[
                                        i
                                    ].percentage_change = percentageChange;
                                }
                            }
                        }
                        const promoted =
                            results[2].length > 0 ? results[2] : [];
                        sendResponse(
                            res,
                            null,
                            {
                                assets,
                                promoted
                            },
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

exports.followAsset = (req, res) => {
    followUnfollowAsset(req, res, true);
};

exports.unFollowAsset = (req, res) => {
    followUnfollowAsset(req, res, false);
};

exports.getPricesFromBulkSymbols = (req, res) => {
    let query = req.query;
    if (query.hasOwnProperty('symbols')) {
        let symbols = query.symbols.split(',');
        models.asset
            .findAll({
                attributes: ['symbol', 'id'],
                include: [
                    {
                        model: models.asset_price,
                        attributes: ['close_price'],
                        as: 'prices',
                        required: true
                    }
                ],
                where: {
                    symbol: {
                        $in: symbols
                    }
                }
            })
            .then(result => {
                let output = [];
                result.map(asset => {
                    let _tmp = {
                        asset_id: asset['id'],
                        symbol: asset['symbol'],
                        prices: []
                    };
                    let _total_prices = asset.prices[0].close_price;
                    if (typeof _total_prices == 'string') {
                        _total_prices = JSON.parse(_total_prices);
                    }
                    if (Object.keys(_total_prices).length > 0) {
                        _tmp['prices'] = makePriceObject(_total_prices);
                    }
                    output.push(_tmp);
                });
                sendResponse(res, null, output);
            })
            .catch(e => console.log('getPricesFromBulkSymbols', e));
    } else
        sendResponse(res, 'mysql_query_error', {
            code: 400,
            message: 'No param(s) found'
        });
};

exports.getAssetPriceSeries = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            const assetId = req.params.id;
            conn.query(
                `SELECT asset_id, price, \`timestamp\` FROM asset_price WHERE asset_id=${assetId}
             ORDER BY \`timestamp\` DESC LIMIT 30;`,
                (err, results) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        let series = results.map(r => r.price);
                        series = series.reverse();
                        sendResponse(res, null, series, conn);
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};

exports.getAssetDetail = (req, res) => {
    let symbol = req.params.symbol;
    models.asset
        .find({
            where: {
                symbol: symbol
            },
            attributes: [
                ['id', 'asset_id'],
                ['name', 'asset_name'],
                'symbol',
                'description',
                ['market_value', 'open'],
                'high',
                'low',
                'volume',
                'close',
                'price_diff',
                'perc_change',
                'asset_category_id'
            ],
            include: [
                {
                    model: models.asset_price,
                    attributes: ['close_price'],
                    as: 'prices'
                }
            ]
        })
        .then(asset => {
            console.log(asset.dataValues);
            models.user_followed_assets
                .find({
                    attributes: ['asset_id', 'uid'],
                    where: {
                        uid: req.headers.uid,
                        asset_id: asset.get('asset_id')
                    }
                })
                .then(follow => {
                    let users = [];
                    // asset.getUsers().then(e => users = e);
                    let _tmp = Object.assign(
                        {},
                        { asset_followed: follow == null ? 0 : 1 },
                        asset.dataValues
                    );
                    // console.log("asset.prices --------------- ", asset.prices[0].close_price);
                    _tmp['prices'] = [];
                    let _total_prices = asset.prices[0].close_price;
                    if (typeof _total_prices == 'string') {
                        _total_prices = JSON.parse(_total_prices);
                    }
                    if (Object.keys(_total_prices).length > 0) {
                        _tmp['prices'] = makePriceObject(_total_prices);
                    }
                    sendResponse(res, null, _tmp);
                });
        })
        .catch(err => sendResponse(res, 'mysql_connection_error', null));
};

const makePriceObject = _total_prices => {
    let output = [],
        count = 0;
    // altered_price = _total_prices.splice(0, 30);
    Object.keys(_total_prices).map(price => {
        let _t = {},
            _timestamp = price;
        _t[JSON.parse(JSON.stringify(_timestamp))] = {
            close: _total_prices[price].close
        };
        output.push(_t);
    });
    return output;
};

// exports.getAssetDetail = (req, res) => {
//     const conn = mysql.create(true);
//     connectMysql(conn)
//         .then(() => {
//             const assetId = req.params.id;
//             conn.query(
//                 `SELECT id, name, symbol, description, ceo, founded, employees, headquarters, high, low, close, volume FROM assets WHERE id=${assetId}`,
//                 (err, results) => {
//                     if (err) {
//                         sendResponse(res, 'mysql_query_error', null, conn);
//                     } else {
//                         sendResponse(res, null, results, conn);
//                     }
//                 }
//             );
//         })
//         .catch(err => {
//             sendResponse(res, 'mysql_connection_error');
//         });
// };

exports.listAll = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            let { start, end, filter } = req.query;
            if (!end) {
                start = 0;
                end = DEFAULT_PAGE_SIZE;
            }
            let queryStr = `select ${asset_params}, IF(ISNULL(ufa.asset_id), false, true) as asset_followed from assets a 
                LEFT OUTER JOIN (select asset_id from user_followed_assets where uid=${
                    req.headers.uid
                }) ufa
                on a.id = ufa.asset_id`;
            if (filter) {
                // use filter, ignore start and end
                queryStr += ` where a.symbol in ${filter};`;
            } else {
                // use start and end
                queryStr += ` limit ${start}, ${end -
                    start}; select count(id) as asset_count from assets;`;
            }
            conn.query(queryStr, (err, results) => {
                if (err) {
                    sendResponse(res, 'mysql_query_error', null, conn);
                } else {
                    let payload = null;
                    if (filter) {
                        payload = {
                            total: results.length,
                            assets: results
                        };
                    } else {
                        payload = {
                            total: results[1][0].asset_count,
                            assets: results[0]
                        };
                    }
                    sendResponse(res, null, payload, conn);
                }
            });
        })
        .catch(err => {
            console.log(err);
            sendResponse(res, 'mysql_connection_error');
        });
};

exports.listTrending = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            let { start, end } = req.query;
            if (!end) {
                start = 0;
                end = DEFAULT_PAGE_SIZE;
            }
            conn.query(
                `select ${asset_params},
            IF(ISNULL(ufa.asset_id), false, true) as asset_followed from assets a
            left outer join (select asset_id from user_followed_assets
            where uid=${req.headers.uid}) ufa
            on a.id = ufa.asset_id
            where a.trending = true
            limit ${start}, ${end - start};
            select count(id) as asset_count from assets where trending = true;`,
                (err, results) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        const payload = {
                            total: results[1][0].asset_count,
                            assets: results[0]
                        };
                        sendResponse(res, null, payload, conn);
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};

exports.listWatchlist = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            let { start, end } = req.query;
            if (!end) {
                start = 0;
                end = DEFAULT_PAGE_SIZE;
            }
            conn.query(
                `select ${asset_params}, true as asset_followed from assets a
            inner join (select asset_id from user_followed_assets
            where uid=${req.headers.uid}) ufa
            on a.id = ufa.asset_id
            limit ${start}, ${end - start};
            select count(a.id) as asset_count from assets a
            inner join (select asset_id from user_followed_assets
            where uid=${req.headers.uid}) ufa
            on a.id = ufa.asset_id;`,
                (err, results) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        const payload = {
                            total: results[1][0].asset_count,
                            assets: results[0]
                        };
                        sendResponse(res, null, payload, conn);
                    }
                }
            );
        })
        .catch(err => {
            console.log('----------listWatchlist-------------', err);
            sendResponse(res, 'mysql_connection_error');
        });
};
