'use strict';
module.exports = (sequelize, DataTypes) => {
    var invite_code_waitlist = sequelize.define(
        'invite_code_waitlist',
        {
            code_sent: DataTypes.BOOLEAN
        },
        { underscored: true }
    );

    invite_code_waitlist.associate = function(models) {
        models.invite_code_waitlist.belongsTo(models.users, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return invite_code_waitlist;
};
