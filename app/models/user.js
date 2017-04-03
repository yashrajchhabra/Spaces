'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        name: DataTypes.STRING,
        password: DataTypes.STRING,
        email: DataTypes.STRING,
        status: DataTypes.BOOLEAN,
        token: DataTypes.STRING,
        role: DataTypes.STRING
    }, {
        classMethods: {
            associate: (models) => {
                // associations can be defined here
            }
        }
    });
    return User;
};