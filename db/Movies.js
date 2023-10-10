import { DataTypes } from "sequelize";

const Movies = (db) => {
    return db.define("movies", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.STRING, unique: true },
    });
};

export default Movies;
