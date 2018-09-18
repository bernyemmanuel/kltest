'use strict';
module.exports = (sequelize, DataTypes) => {
    var code = sequelize.define(
        'code',
        {
            key: {
                type: DataTypes.STRING,
                // defaultValue: function() {
                //     return Math.random()
                //         .toString(36)
                //         .substring(6)
                //         .toUpperCase();
                // },
                unique: true
            },
            is_used: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            use_count: {
                type: DataTypes.INTEGER,
                defaultValue: 1
            },
            end_date: {
                type: DataTypes.STRING,
                defaultValue: 'false'
            }
        },
        { underscored: true }
    );

    code.associate = function(models) {
        models.code.belongsTo(models.code_type, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    // Code.beforeCreate(_code => {
    //   if(!_code.use_count || _code.use_count == ''){
    //     _code.use_count = 1;
    //   }
    // })

    // code.sync({force: true});

    return code;
};
