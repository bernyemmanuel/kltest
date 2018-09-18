'use strict';
module.exports = (sequelize, DataTypes) => {
    var asset = sequelize.define(
        'asset',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true
            },
            name: DataTypes.STRING(100),
            market_value: DataTypes.DOUBLE,
            description: DataTypes.TEXT,
            asset_category_id: DataTypes.STRING(10),
            symbol: DataTypes.STRING(5),
            perc_change: DataTypes.DOUBLE,
            price_diff: DataTypes.DOUBLE,
            trending: DataTypes.BOOLEAN,
            high: DataTypes.DOUBLE,
            low: DataTypes.DOUBLE,
            close: DataTypes.DOUBLE,
            volume: DataTypes.INTEGER(11),
            daily_close: DataTypes.DOUBLE,
            dw_instrument_id: DataTypes.STRING(50),
            image_url: DataTypes.STRING(500)
        },
        { underscored: true }
    );

    asset.associate = function(models) {
        models.asset.hasMany(models.asset_price_daily);
        models.asset.hasMany(models.asset_price_weekly);
        models.asset.hasMany(models.asset_price, { as: 'prices' });
        models.asset.hasMany(models.asset_frequency);
        // models.asset.hasMany(models.user_followed_assets);
        models.asset.belongsToMany(models.users, {
            through: 'user_followed_assets',
            foreignKey: 'asset_id'
        });
    };

    return asset;
};
