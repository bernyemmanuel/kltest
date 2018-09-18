'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(__filename);
var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config.json')['db'];
var db = {};
const Op = Sequelize.Op;
const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
};

var sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: 'mysql',
        operatorsAliases,
        logging: false,
        pool: {
            max: 5,
            min: 1,
            idle: 20000,
            evict: 20000,
            acquire: 20000
        }
    }
);

fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js'
        );
    })
    .forEach(file => {
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

const updateFrequency = (detail, from) => {
    db['asset_frequency']
        .findOrCreate({
            where: { from: from, asset_id: detail.asset_id }
        })
        .spread((_freq, created) => {
            _freq.increment('call_count', { by: 1 });
        });
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

sequelize.sync().then(e => {
    console.log('sync successfull');
    // db['asset_price'].beforeUpsert((instance, options) => {
    //     updateFrequency(instance, 'INTRA');
    // });
    db['asset_price_daily'].beforeUpsert((instance, options) => {
        updateFrequency(instance, 'DAILY');
    });
    db['asset_price_weekly'].beforeUpsert((instance, options) => {
        updateFrequency(instance, 'WEEKLY');
    });
});

module.exports = db;
