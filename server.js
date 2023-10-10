//import packages from npm
import express from "express";
import cors from "cors";
import fs from "fs";
// const fs = require("fs");
import jwt from "jsonwebtoken";
// const jwt = require("jsonwebtoken");
import { db, Users, Movies, Genres, Moviesgenres, Ratings } from "./db/db.js";
import { Clerk } from "@clerk/backend";
import clerkAPIKey from "./clerkAPIKey.js";
import { Op } from "sequelize";

//set up express to use json and cors
const server = express();
server.use(cors());
server.use(express.json());

let dbUserID;

const clerk = Clerk({
    apiKey: clerkAPIKey,
});

const validateUserTokenMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        res.status(401).send({ error: "Authorization header not specified!" });
        return;
    }

    const headerParts = header.split(" ");
    if (headerParts.length !== 2) {
        res.status(401).send({
            error: `Malformed Authorization header - expected two words, found ${headerParts.length}`,
        });
        return;
    }

    if (headerParts[0] !== "Bearer") {
        res.status(401).send({
            error: `Malformed Authorization header - expected Bearer scheme, found ${headerParts[0]}`,
        });
        return;
    }

    const token = headerParts[1];
    if (token.length === 0) {
        res.status(401).send({
            error: "Malformed Authorization header - missing token!",
        });
        return;
    }

    const publicKey = fs.readFileSync("./clerk-public-key.pem", {
        encoding: "utf-8",
    });
    let decoded;
    try {
        decoded = jwt.verify(token, publicKey);
    } catch (error) {
        console.error("Error validating token:", error.message);
        res.status(401).json({
            error: "Malformed Authorization header - invalid token!",
        });
        return;
    }

    // const user = await Users.findOne({ where: { userid: decoded.sub } });

    // Extract the clerk user id from the decoded token data
    // req.auth = { clerkUserId: decoded.sub, dbUserID: user.id };
    // console.log(decoded);
    // console.log(req.body);

    // console.log(req.body);

    next();
};

server.get("/", (req, res) => {
    res.send({ status: "onlineforcapstone" });
});

server.post("/users", async (req, res) => {
    const userDetails = await Users.findOrCreate({
        where: {
            clerkid: req.body.clerkid,
        },
        defaults: {
            firstname: req.body.firstName,
            lastname: req.body.lastName,
            email: req.body.email,
        },
    });

    dbUserID = userDetails[0].dataValues.id;
    console.log(req.body);
    // console.log("dbUser ID", dbUserID);
    res.send({});
});

// server.post("/users", validateUserTokenMiddleware, async (req, res) => {
//     const userDetails = await Users.findOrCreate({
//         where: {
//             clerkid: req.body.clerkid,
//         },
//         defaults: {
//             firstname: req.body.firstName,
//             lastname: req.body.lastName,
//             email: req.body.email,
//         },
//     });
//     console.log(req.body);

//     res.send({});
// currentuserid = userDetails[0].dataValues.id;

// console.log(req.auth);
// console.log(req.body);
// const rawUser = await db.query(
//     `SELECT id FROM users WHERE clerkid='${req.auth.clerkUserId}'`
// );
// if (rawUser.rows.length === 0) {
//     res.status(404).send({
//         error: `No user found for clerk id ${req.auth.clerkUserId}`,
//     });
//     return;
// }
// const userId = rawUser.rows[0].id;

// const userss = await db.query(
//     `SELECT * FROM todo WHERE created_by_user_id=${userId}`
// );
// res.status(200).send({
//     results: userss.rows,
// });
// users: await Users.findAll({
//     where: { clerkid: `${req.auth.clerkUserId}` },
//     include: Movieratings,
// }),
//send request to frontend
//     res.send({});
// });

server.get("/users", async (req, res) => {
    //send request to frontend
    res.send({
        users: await Users.findAll(),
    });
});

server.post("/movies", async (req, res) => {
    console.log("dbUser ID", dbUserID);

    req.body.forEach(async (bod) => {
        let movieDetails = await Movies.findOrCreate({
            where: { title: bod.ratedTitle },
        });

        await Ratings.findOrCreate({
            where: {
                movieid: movieDetails[0].id, // table = movies, value = movieid
                userid: dbUserID, // table = users, value, userid
            },
            defaults: {
                rating: bod.rated, // rating out of 10
            },
        });

        bod.ratedGenres.forEach(async (genre) => {
            let genreString = genre.toString();
            let genreDetails = await Genres.findOrCreate({
                where: {
                    genreName: genreString,
                },
            });
            await Moviesgenres.findOrCreate({
                where: {
                    genreid: genreDetails[0].dataValues.id, // table = moviesgenres, value = genreid
                    movieid: movieDetails[0].dataValues.id, // table = moviesgenres, value = movieid
                },
            });
        });
    });

    res.send({ resp: "id: movieDetails.dataValues.id" });

    // const a = await findCompatibleUsers();
});

// findCompatibleUsers();

server.get("/movies", async (req, res) => {
    res.send({ movies: await Movies.findAll() });
});

server.get("/matchedUsers", async (req, res) => {
    const matchedUsers = [];

    // PULL CURRENT USER RATINGS AND MOVIES RATED
    function calculateCompatibility(userA, userB) {
        // let commonGenres = 0;
        let del = 0;
        let score = 0;
        let commonLikedMovies = [];
        let commonDislikedMovies = [];
        let commonRatedMovieNames = [];

        const commonlyRatedMovieNames = (a, b) => {
            commonRatedMovieNames.push(b.movieTitle);

            if (a.rating <= 4 && b.rating <= 4) {
                commonDislikedMovies.push(b.movieTitle);
            } else if (a.rating >= 7 && b.rating >= 7) {
                commonLikedMovies.push(b.movieTitle);
            }
        };

        userA.forEach((reviewA) => {
            userB.reviews.forEach((reviewB) => {
                //note that reviews is an array in userB object that has the same structure as userA
                //the only difference is that userA does not contain a 'user' key
                if (reviewA.movie === reviewB.movie) {
                    commonlyRatedMovieNames(reviewA, reviewB);
                    del = Math.abs(reviewA.rating - reviewB.rating);
                    if (del <= 1) {
                        score += 5;
                    } else if ((del = 2)) {
                        score += 4;
                    } else if ((del = 3)) {
                        score += 3;
                    }
                }
            });
        });

        // Calculate similarity score based on common genres and average rating difference
        const similarityScore =
            score === 0 ? 0 : score / commonRatedMovieNames.length;

        if (similarityScore >= 4) {
            const matchedUser = {
                userB: userB.userFirstName,
                similarityScore: similarityScore,
                likedMovies: commonLikedMovies,
                dislikedMovies: commonDislikedMovies,
                commonRatedMovieNames: commonRatedMovieNames,
            };
            matchedUsers.push(matchedUser);
        }

        matchedUsers.sort(
            (a, b) =>
                b.commonRatedMovieNames.length - a.commonRatedMovieNames.length
        );
        console.log(matchedUsers);
        return matchedUsers;
    }

    const findCompatibleUsers = async () => {
        // select current user's movies and their respective user ratings
        const currentUserRatedMovies = (
            await Ratings.findAll({
                where: { userid: { [Op.eq]: dbUserID } },
            })
        ).map((movie) => {
            return {
                movie: movie.movieid,
                rating: movie.rating,
                // genres: movie.moviesgenres,
            };
        });

        // JUST A TEST IGNORE THE FOLLOWING FUNCTION usersandmovies
        /*
    const usersandmovies = (
        await Ratings.findAll({
            where: {
                [Op.and]: {
                    userid: { [Op.not]: dbUserID },
                    movieid: {
                        [Op.in]: currentUserRatedMovies.map((a) => a.movie),
                    },
                },
            },
            include: [Movies, Users],
            include: [{ model: Movies, include: Moviesgenres }],
        })
    ).map((match) => {
        return {
            user: match.userid,
            userFirstName: match.user.firstname,
            movie: match.movieid,
            movieTitle: match.movie.title,
            rating: match.rating,
        };
    });
    */
        // END OF TEST

        // select ratings from users (!= current user) and their ratings for the same movies that the current user rated
        const matchedMovies = (
            await Ratings.findAll({
                where: {
                    [Op.and]: {
                        userid: { [Op.not]: dbUserID },
                        movieid: {
                            [Op.in]: currentUserRatedMovies.map((a) => a.movie),
                            //finds ratings where movies are in the current user's Rated Movies array
                        },
                    },
                },
                include: [Movies, Users],
                // include: [{ model: Movies, include: Moviesgenres }],
            })
        ).map((match) => {
            return {
                user: match.userid,
                userFirstName: match.user.firstname,
                movie: match.movieid,
                movieTitle: match.movie.title,
                rating: match.rating,
            };
        });

        let users = {};

        for (const match of matchedMovies) {
            const { user, userFirstName, movie, movieTitle, rating } = match;

            if (!users[user]) {
                users[user] = { user, userFirstName, reviews: [] };
            }
            users[user].reviews.push({ movie, movieTitle, rating });
        }
        const matchesArr = Object.values(users);

        const matchedUsers = matchesArr.forEach((userB) => {
            calculateCompatibility(currentUserRatedMovies, userB);
        });
    };
    await findCompatibleUsers();

    res.send({ matches: matchedUsers });
    // matchedUsers = [];
});

server.listen(3011, () => {
    console.log("Server running on 3011");
});

// server.get("/users", validateUserTokenMiddleware, async (req, res) => {
//     // const rawUser = await db.query(
//     //     `SELECT id FROM users WHERE clerkid='${req.auth.clerkUserId}'`
//     // );
//     // if (rawUser.rows.length === 0) {
//     //     res.status(404).send({
//     //         error: `No user found for clerk id ${req.auth.clerkUserId}`,
//     //     });
//     //     return;
//     // }
//     // const userId = rawUser.rows[0].id;

//     // const userss = await db.query(
//     //     `SELECT * FROM todo WHERE created_by_user_id=${userId}`
//     // );
//     // res.status(200).send({
//     //     results: userss.rows,
//     // });
//     // users: await Users.findAll({
//     //     where: { clerkid: `${req.auth.clerkUserId}` },
//     //     include: Movieratings,
//     // }),
//     //send request to frontend
//     res.send({
//         users: await Users.findAll({ include: Movieratings }),
//     });
// });

// server.get("/movieratings", async (req, res) => {
//     //send request to frontend
//     res.send({
//         movieratings: await Movieratings.findAll({ include: Moviegenres }),
//     });
// });

// server.post("/movieratings", async (req, res) => {
//     // in the data array recd, create a new row in movieratings table for each movierating object
//     for (const bod of req.body) {
//         const ratingDetails = await Movieratings.create(bod);
//         // console.log(bod);

//         //inside each individual movierating object, loop over genres and push them in moviegenres table
//         for (const ratedgenre of bod.ratedGenres) {
//             await Moviegenres.create({
//                 userid: bod.userid,
//                 movieid: ratingDetails.dataValues.id,
//                 ratedGenreid: ratedgenre,
//             });
//         }
//     }
// });

// server.get("/secret-word", validateUserTokenMiddleware, (req, res) => {
//     const clerkUserId = req.auth.clerkUserId;
//     res.send({ data: "static" });
// });

// Get the user’s secret word
// db.query(`SELECT secret_word FROM users where clerkid='${clerkUserId}'`).then(
//     (result) => {
//         // If the user is already in the table, respond with their secret word

//         if (result.rowCount > 0) {
//             let firstRow = result.rows[0];
//             res.send({ data: firstRow.secret_word });
//         } else {
//             // If the user is not defined, make them a new row
//             const secretWord = randomWord();
//             db.query(
//                 `INSERT INTO users (clerkid, secret_word)
//          VALUES ('${clerkUserId}', '${secretWord}')`
//             ).then(() => {
//                 res.send({ data: secretWord });
//             });
//         }
//     }
// );
