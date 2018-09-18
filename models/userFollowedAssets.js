'use strict';
module.exports = (sequelize, DataTypes) => {
    var user_followed_assets = sequelize.define(
        'user_followed_assets',
        {
            timestamp: {
                type: 'TIMESTAMP'
            }
        },
        { timestamps: false, underscored: true }
    );

    user_followed_assets.associate = function(models) {
        models.user_followed_assets.belongsTo(models.asset, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
        models.user_followed_assets.belongsTo(models.users, {
            onDelete: 'CASCADE',
            foreignKey: 'uid'
        });
    };

    return user_followed_assets;
};
