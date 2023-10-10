import { DataTypes } from "sequelize";

const Ratings = (db) => {
    return db.define("ratings", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userid: DataTypes.INTEGER,
        movieid: DataTypes.INTEGER,
        rating: DataTypes.INTEGER,
    });
};

export default Ratings;
