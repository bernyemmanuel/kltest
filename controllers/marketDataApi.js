import { GetPricePerToken } from '../helpers/validators';

exports.getStockPrice = (req, res) => {
    const conn = mysql.create(true);
    connectMysql(conn)
        .then(() => {
            conn.query('select symbol,id from assets', (err, rows, fields) => {
                if (err) {
                    sendResponse(res, 'mysql_query_error', null, conn);
                } else {
                    sendResponse(res, null, null, conn);
                    // send response that we have started proccesssing
                    let symbols = '';
                    rows.forEach(asset => {
                        symbols +=
                            symbols === '' ? asset.symbol : `,${asset.symbol}`;
                    });
                    GetPricePerToken(null, null, symbols)
                        .then(marketPrice => {
                            let query = '';
                            marketPrice.forEach(value => {
                                query += `update assets set market_value = ${
                                    value.ask
                                } where symbol = '${value.symbol}';`;
                            });
                            const connRes = mysql.create(true);
                            connectMysql(connRes).then(() => {
                                connRes.query(
                                    query,
                                    (
                                        errFinalData,
                                        rowsFinalData,
                                        fieldsFinalData
                                    ) => {
                                        if (!errFinalData) connRes.end();
                                    }
                                );
                            });
                        })
                        .catch(errSym => {});
                }
            });
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};
