import sendRequest from './sendRequest';

const CheckAsset = (assetId, conn) =>
    new Promise((resolve, reject) => {
        conn.query(
            `select count(*) as count from assets where id=${assetId}`,
            (err, results, fields) => {
                if (err) reject('mysql_query_error');
                else if (results[0].count === 1) resolve();
                else reject({ code: 3002, message: 'Invalid asset Id' });
            }
        );
    });

const sendPriceRequest = symbols =>
    new Promise((resolve, reject) => {
        sendRequest
            .send('quotes', { symbols })
            .then(result => {
                if (result[0].ask != null) {
                    if (result.length > 1) {
                        // multiple symbols passed
                        resolve(result);
                    } else {
                        resolve(result[0].ask);
                    }
                } else {
                    reject();
                }
            })
            .catch(errResp => {
                reject();
            });
    });

const GetPricePerToken = (assetId, conn, assetSymbol) =>
    new Promise((resolve, reject) => {
        if (assetSymbol == null) {
            conn.query(
                `select symbol from assets where id = ${assetId}`,
                (err, results, fields) => {
                    if (err) reject();
                    else if (results.length !== 1) reject();
                    else {
                        sendPriceRequest(results[0].symbol)
                            .then(price => {
                                resolve(price);
                            })
                            .catch(() => {
                                reject();
                            });
                    }
                }
            );
        } else {
            sendPriceRequest(assetSymbol)
                .then(price => {
                    resolve(price);
                })
                .catch(() => {
                    reject();
                });
        }
    });

export { CheckAsset, GetPricePerToken };
