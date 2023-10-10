import { DataTypes } from "sequelize";
// import Genres from "./Genres";
// import Movies from "./Movies";

const Moviesgenres = (db) => {
    return db.define("moviesgenres", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        genreid: {
            type: DataTypes.INTEGER,
            // references: {
            //     model: Genres,
            //     key: "id",
            // },
        },
        movieid: {
            type: DataTypes.INTEGER,
            // references: {
            //     model: Movies,
            //     key: "id",
            // },
        },
    });
};

export default Moviesgenres;
