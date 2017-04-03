'use strict';
module.exports = (sequelize, DataTypes) => {
    const Space = sequelize.define('Space', {
        title: DataTypes.STRING,
        fields: DataTypes.JSONB,
        userId: DataTypes.INTEGER,
        status: DataTypes.STRING,
        shareId: DataTypes.STRING,
        deadline: DataTypes.DATE,
        sharedWith: DataTypes.ARRAY(DataTypes.STRING)
    }, {
        classMethods: {
            associate: (models) => {
                // associations can be defined here
            }
        }
    });
    return Space;
};