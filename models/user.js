'use strict';
module.exports = (sequelize, DataTypes) => {
    var users = sequelize.define(
        'users',
        {
            uid: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true
            },
            mobile_number: DataTypes.BIGINT(10),
            email_id: DataTypes.STRING(50),
            country_code: DataTypes.ENUM('+91', '+1'),
            device_type: DataTypes.ENUM('ANDROID', 'IOS'),
            device_id: DataTypes.STRING(36),
            status: {
                type: DataTypes.BOOLEAN,
                defaultValue: 0
            },
            referrer_uid: DataTypes.INTEGER(10),
            referal_code: DataTypes.STRING(9),
            passcode: DataTypes.STRING(64),
            first_name: DataTypes.STRING(45),
            last_name: DataTypes.STRING(45),
            dw_user_id: DataTypes.STRING(100),
            dw_account_id: DataTypes.STRING(100)
        },
        { timestamps: false, underscored: true }
    );

    users.associate = function(models) {
        models.users.hasMany(models.invite_code_waitlist);
        // models.users.hasMany(models.user_followed_assets, {
        //     foreignKey: 'uid'
        // });
        // models.users.belongsToMany(models.asset, {
        //     through: 'user_followed_assets',
        //     foreignKey: 'uid'
        // });
    };

    return users;
};
