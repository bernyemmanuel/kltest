'use strict';
const moment = require('moment');
module.exports = (sequelize, DataTypes) => {
    var asset_frequency = sequelize.define(
        'asset_frequency',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            asset_id: {
                type: DataTypes.INTEGER.UNSIGNED
            },
            call_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            from: {
                type: DataTypes.ENUM,
                values: ['DAILY', 'WEEKLY', 'INTRA']
            }
        },
        {
            timestamps: true,
            paranoid: true,
            underscored: true,
            tableName: 'asset_frequency'
        }
    );
    asset_frequency.associate = function(models) {
        models.asset_frequency.belongsTo(models.asset, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return asset_frequency;
};
