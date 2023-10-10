import { DataTypes } from "sequelize";

const Users = (db) => {
    return db.define("users", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        clerkid: { type: DataTypes.STRING, unique: true },
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        sex: DataTypes.STRING,
        email: DataTypes.STRING,
        dob: DataTypes.DATEONLY,
        prefferdsex: DataTypes.STRING,
        // interests: DataTypes.STRING,
    });
};

export default Users;
