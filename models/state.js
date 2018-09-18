'use strict';
module.exports = (sequelize, DataTypes) => {
    var state = sequelize.define(
        'states',
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                primaryKey: true
            },
            name: DataTypes.STRING(150)
        },
        {
            timestamps: false,
            underscored: true
        }
    );

    state.associate = function(models) {
        models.states.belongsTo(models.countries, {
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    };

    return state;
};
