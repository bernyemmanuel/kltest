'use strict';
const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
    var asset_price_daily = sequelize.define(
        'asset_price_daily',
        {
            close_price: DataTypes.TEXT,
            asset_id: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                unique: true
            }
        },
        {
            underscored: true,
            tableName: 'asset_price_daily'
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['asset_id']
                }
            ]
        }
    );
    asset_price_daily.associate = function(models) {
        models.asset_price_daily.belongsTo(models.asset, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return asset_price_daily;
};
