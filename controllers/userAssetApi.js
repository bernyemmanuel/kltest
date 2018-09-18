'user strict';

import { GetPricePerToken } from '../helpers/validators';

exports.getWatchList = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            const randomNumber = Math.random();
            const percentageChange =
                randomNumber < 0.5
                    ? Math.floor(randomNumber * -10)
                    : Math.floor(randomNumber * 10);
            conn.query(
                `select ufa.asset_id as asset_id, a.name as asset_name, a.icon, a.market_value, a.perc_change,
        true as asset_followed,${percentageChange} as percentage_change,
        ufa.timestamp as date_watched
        from user_followed_assets as ufa
        join assets a on a.id = ufa.asset_id
        where uid = ${req.headers.uid}`,
                (err, results, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        // else
                        const watchedAssets = results.length > 0 ? results : [];
                        sendResponse(
                            res,
                            null,
                            { watched_assets: watchedAssets },
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

exports.getMyAssets = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select a.id as asset_id, a.name as asset_name, a.market_value,
        a.description, ua.quantity as quantity, a.symbol, ac.category_name
        from user_assets ua join assets a on a.id = ua.asset_id
        join asset_categories ac on ac.id = a.asset_category_id
        where ua.uid = ${req.headers.uid};
        select asset_quantity as quantity,amount,price_per_asset,asset_id,transaction_type
        from user_asset_transactions where uid =${
            req.headers.uid
        } order by asset_id,timestamp asc;
        `,
                (err, results, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else {
                        // else
                        let symbols = '';
                        results[0].forEach(asset => {
                            //
                            symbols +=
                                symbols === ''
                                    ? asset.symbol
                                    : `,${asset.symbol}`;
                        });
                        if (results[0].length === 0) {
                            sendResponse(
                                res,
                                null,
                                {
                                    my_assets: [],
                                    summary: {
                                        total_values: 0,
                                        total_invested: 0,
                                        value_changed: 0,
                                        percentange_change: 0,
                                        asset_categories: []
                                    }
                                },
                                conn
                            );
                        } else {
                            GetPricePerToken(null, conn, symbols)
                                .then(marketPrice => {
                                    let totalValues = 0;
                                    const markePriceArr = {};
                                    const assetIdQty = {};
                                    let totalInvested = 0;
                                    const assetInvestedAmount = [];
                                    if (results[0].length === 1) {
                                        markePriceArr[
                                            results[0][0].symbol
                                        ] = marketPrice;
                                    } else {
                                        marketPrice.forEach(value => {
                                            markePriceArr[value.symbol] =
                                                value.ask;
                                        });
                                    }
                                    results[0].forEach(asset => {
                                        totalValues +=
                                            markePriceArr[asset.symbol] *
                                            asset.quantity;
                                        assetIdQty[asset.asset_id] =
                                            asset.quantity;
                                    });

                                    let prevAssetId = '';
                                    let prevAssetInvested = [];
                                    results[1].forEach(transaction => {
                                        if (
                                            prevAssetId !== transaction.asset_id
                                        ) {
                                            if (prevAssetId !== '') {
                                                let assetInestment = 0;
                                                prevAssetInvested.forEach(
                                                    value => {
                                                        totalInvested +=
                                                            value.qty *
                                                            value.price_per_asset;
                                                        assetInestment +=
                                                            value.qty *
                                                            value.price_per_asset;
                                                    }
                                                );
                                                assetInvestedAmount[
                                                    prevAssetId
                                                ] = assetInestment;
                                            }
                                            prevAssetInvested = [];
                                            prevAssetId = transaction.asset_id;
                                        }
                                        if (
                                            transaction.transaction_type ===
                                            'BUY'
                                        ) {
                                            prevAssetInvested.push({
                                                qty: transaction.quantity,
                                                price_per_asset:
                                                    transaction.price_per_asset
                                            });
                                        } else {
                                            let transactQty =
                                                transaction.quantity;
                                            for (
                                                let i = 0;
                                                i < prevAssetInvested.length;
                                                i += 1
                                            ) {
                                                if (
                                                    prevAssetInvested[i].qty >=
                                                    transactQty
                                                ) {
                                                    prevAssetInvested.splice(
                                                        i,
                                                        1,
                                                        {
                                                            qty:
                                                                prevAssetInvested[
                                                                    i
                                                                ].qty -
                                                                transactQty,
                                                            price_per_asset:
                                                                prevAssetInvested[
                                                                    i
                                                                ]
                                                                    .price_per_asset
                                                        }
                                                    );
                                                    break;
                                                } else {
                                                    const temp =
                                                        transactQty -
                                                        prevAssetInvested[i]
                                                            .qty;
                                                    prevAssetInvested.splice(
                                                        i,
                                                        1,
                                                        {
                                                            qty: 0,
                                                            price_per_asset:
                                                                prevAssetInvested[
                                                                    i
                                                                ]
                                                                    .price_per_asset
                                                        }
                                                    );
                                                    transactQty = temp;
                                                }
                                            }
                                        }
                                    });

                                    let assetInestment = 0;
                                    prevAssetInvested.forEach(value => {
                                        totalInvested +=
                                            value.qty * value.price_per_asset;
                                        assetInestment +=
                                            value.qty * value.price_per_asset;
                                    });
                                    assetInvestedAmount[
                                        prevAssetId
                                    ] = assetInestment;

                                    const valueChanged = parseFloat(
                                        (totalValues - totalInvested).toFixed(2)
                                    );
                                    const percentageChange = parseFloat(
                                        (valueChanged / totalInvested).toFixed(
                                            4
                                        )
                                    );
                                    const assets = results[0];
                                    const assetCatgInvestedAmount = {};
                                    for (let i = 0; i < assets.length; i += 1) {
                                        assets[i].value = parseFloat(
                                            (
                                                assets[i].quantity *
                                                markePriceArr[assets[i].symbol]
                                            ).toFixed(2)
                                        );
                                        const assetPriceChanged =
                                            assets[i].value -
                                            assetInvestedAmount[
                                                assets[i].asset_id
                                            ];
                                        const assetPer =
                                            (assetPriceChanged /
                                                assetInvestedAmount[
                                                    assets[i].asset_id
                                                ]) *
                                            100;
                                        assets[
                                            i
                                        ].percentange_change = parseFloat(
                                            assetPer.toFixed(2)
                                        );
                                        if (
                                            assetCatgInvestedAmount[
                                                assets[i].category_name
                                            ] != null
                                        ) {
                                            assetCatgInvestedAmount[
                                                assets[i].category_name
                                            ] +=
                                                assetInvestedAmount[
                                                    assets[i].asset_id
                                                ];
                                        } else {
                                            assetCatgInvestedAmount[
                                                assets[i].category_name
                                            ] =
                                                assetInvestedAmount[
                                                    assets[i].asset_id
                                                ];
                                        }
                                    }
                                    const assetCategories = [];
                                    Object.keys(assetCatgInvestedAmount).map(
                                        key =>
                                            assetCategories.push({
                                                category_name: key,
                                                amount: parseFloat(
                                                    assetCatgInvestedAmount[
                                                        key
                                                    ].toFixed(2)
                                                ),
                                                amount_rounded: parseInt(
                                                    assetCatgInvestedAmount[
                                                        key
                                                    ],
                                                    10
                                                )
                                            })
                                    );
                                    sendResponse(
                                        res,
                                        null,
                                        {
                                            my_assets: results[0],
                                            summary: {
                                                total_values: parseFloat(
                                                    totalValues.toFixed(2)
                                                ),
                                                total_invested: parseFloat(
                                                    totalInvested.toFixed(2)
                                                ),
                                                value_changed: valueChanged,
                                                percentange_change: parseFloat(
                                                    (
                                                        percentageChange * 100
                                                    ).toFixed(2)
                                                ),
                                                asset_categories: assetCategories
                                            }
                                        },
                                        conn
                                    );
                                })
                                .catch(errPrice => {});
                        }
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};
