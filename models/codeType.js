'use strict';
module.exports = (sequelize, DataTypes) => {
    var code_type = sequelize.define(
        'code_type',
        {
            name: DataTypes.STRING,
            prefix: DataTypes.STRING
        },
        { underscored: true }
    );

    code_type.associate = function(models) {
        models.code_type.hasMany(models.code);
    };

    // force: true will drop the table if it already exists
    // code_type.sync({force: true});

    return code_type;
};
