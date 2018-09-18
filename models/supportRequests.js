'use strict';
module.exports = (sequelize, DataTypes) => {
    var support_requests = sequelize.define(
        'support_requests',
        {
            uid: DataTypes.INTEGER.UNSIGNED,
            message: DataTypes.TEXT,
            type: DataTypes.STRING(2),
            status: DataTypes.INTEGER(1)
        },
        { underscored: true }
    );

    // support_requests.associate = function(models) {
    //     models.belongsTo.hasMany(models.users);
    //     // models.users.hasMany(models.user_followed_assets, {
    //     //     foreignKey: 'uid'
    //     // });
    //     // models.users.belongsToMany(models.asset, {
    //     //     through: 'user_followed_assets',
    //     //     foreignKey: 'uid'
    //     // });
    // };

    return support_requests;
};
