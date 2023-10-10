import { DataTypes } from "sequelize";

const Genres = (db) => {
    return db.define("genres", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        genreName: DataTypes.STRING,
    });
};

export default Genres;
