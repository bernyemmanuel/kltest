'use strict';
module.exports = (sequelize, DataTypes) => {
    var country = sequelize.define(
        'countries',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true
            },
            short_name: DataTypes.STRING(3),
            name: DataTypes.STRING(150),
            phone_code: DataTypes.INTEGER(11)
        },
        {
            timestamps: false,
            underscored: true
        }
    );

    country.associate = function(models) {
        models.countries.hasMany(models.states);
    };

    return country;
};
