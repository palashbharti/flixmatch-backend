import { Sequelize } from "sequelize";
import UsersModel from "./Users.js";
import MoviesModel from "./Movies.js";
import GenresModel from "./Genres.js";
import RatingsModel from "./Ratings.js";
import MoviesgenresModel from "./Moviesgenres.js";

const db = new Sequelize(
    "postgres://reachpalashbharti@localhost:5432/flixmatch",
    { logging: false }
);

const Users = UsersModel(db);
const Movies = MoviesModel(db);
const Genres = GenresModel(db);
const Moviesgenres = MoviesgenresModel(db);
const Ratings = RatingsModel(db);

const connectToDB = async () => {
    try {
        await db.authenticate();
        console.log("Connected to database");

        // Parent tables: Movies Users and Genres
        // Children table: Ratings linking Movies and Users; and Moviesgenres linking Movies and Genres
        Movies.hasMany(Ratings, {
            foreignKey: "movieid",
        });

        Ratings.belongsTo(Movies, {
            foreignKey: "movieid",
        });

        Users.hasMany(Ratings, {
            foreignKey: "userid",
        });
        Ratings.belongsTo(Users, {
            foreignKey: "userid",
        });

        Movies.hasMany(Moviesgenres, {
            foreignKey: "movieid",
        });

        Moviesgenres.belongsTo(Movies, {
            foreignKey: "movieid",
        });

        Genres.hasMany(Moviesgenres, {
            foreignKey: "genreid",
        });

        Moviesgenres.belongsTo(Genres, {
            foreignKey: "genreid",
        });

        db.sync(); //{ force: true }
    } catch (error) {
        console.error(error);
        console.error("DB issue!!!!");
    }
};

connectToDB();

export { db, Users, Movies, Genres, Moviesgenres, Ratings };
