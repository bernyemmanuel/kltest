'use strict';
const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
    var asset_price = sequelize.define(
        'asset_price',
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
            tableName: 'asset_price'
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
    asset_price.associate = function(models) {
        models.asset_price.belongsTo(models.asset, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return asset_price;
};
