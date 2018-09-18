import Mysql from 'mysql';

exports.create = multipleStatements => {
    const conn = Mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.username,
        password: config.db.password,
        database: config.db.database,
        dateStrings: true,
        multipleStatements: multipleStatements != null
    });
    return conn;
};
