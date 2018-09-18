'use strict';
const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
    var asset_price_weekly = sequelize.define(
        'asset_price_weekly',
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
            tableName: 'asset_price_weekly'
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
    asset_price_weekly.associate = function(models) {
        models.asset_price_weekly.belongsTo(models.asset, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return asset_price_weekly;
};
