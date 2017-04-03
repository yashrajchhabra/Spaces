'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Spaces', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            fields: {
                type: Sequelize.JSONB
            },
            userId: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING
            },
            shareId: {
                type: Sequelize.STRING
            },
            deadline: {
                type: Sequelize.DATE
            },
            sharedWith: {
                type: Sequelize.ARRAY(Sequelize.STRING)
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Spaces');
    }
};