exports.getMyDocuments = (req, res) => {
    const conn = mysql.create();
    connectMysql(conn)
        .then(() => {
            conn.query(
                `select ud.url, dt.document_type, ud.timestamp,ud.meta_data from user_documents ud
        join document_type dt on dt.id = ud.document_type_id where ud.uid = ${
            req.headers.uid
        }`,
                (err, results, fields) => {
                    if (err) {
                        sendResponse(res, 'mysql_query_error', null, conn);
                    } else if (results.length === 0) {
                        sendResponse(res, null, { documents: [] }, conn);
                    } else {
                        sendResponse(res, null, { documents: results }, conn);
                    }
                }
            );
        })
        .catch(err => {
            sendResponse(res, 'mysql_connection_error');
        });
};
