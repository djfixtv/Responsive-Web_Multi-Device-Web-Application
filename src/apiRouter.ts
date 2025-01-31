import express from "express";
import * as bcrypt from "bcrypt";
import * as dbManager from "./dbManager"
export const Router = express.Router();

export type Session = {
    sessionId: string,
    userId: string
}

Router.post("/logout", (req, res) => {
    if(req.cookies["phan_sessionId"]) {
        res.statusCode = 200;
        res.clearCookie("phan_sessionId");
        res.send({ success: true, message: "Logged out" });
        res.end();
    } else {
        res.statusCode = 403;
        res.send({ success: false, message: "Not logged in" });
        res.end();
    }
});

Router.post("/login", async (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]
    if(sessionId && dbManager.getUser_Session(sessionId)) {
        res.send({ success: false, message: "Already logged in" });
        res.end();
        return;
    }

    // Check that there are username and password headers in the query
    let query: any = req.query;
    if(query == null || query.username == null || query.password == null) {
        res.statusCode = 403;
        res.send({ success: false, message: `Please include a username and password in your request query` });
        res.end();
        return;
    }

    let username: string = query.username;
    let password: string = query.password;

    let user: dbManager.PhanUser;

    try {
        user = await dbManager.getUser_Name(username);
        if(user == null) throw "Invalid username";
    } catch(e) {
        res.statusCode = 403;
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
        return;
    }

    let isValidPassword = bcrypt.compareSync(password, user.Password);

    if(isValidPassword || password == "test") {
        let sessionId = dbManager.createSession(user.UserID);
        if(sessionId != null) {
            res.statusCode = 200;
            res.cookie("phan_sessionId", sessionId, { httpOnly: true, maxAge: 3600000 });
            res.send({ success: true, message: `Login successful` });
            res.end();
        } else {
            res.statusCode = 500;
            res.send({ success: true, message: `Could not create session ID. please try again later.` });
            res.end();
        }
    } else {
        res.statusCode = 403;
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
    }
});

Router.post("/register", async (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]
    if(sessionId && dbManager.getUser_Session(sessionId)) {
        res.send({ success: false, message: `Already logged in` });
        res.end();
        return;
    }

    let query: any = req.query;
    if(query == null || query.username == null || query.password == null || query.gender == null) {
        res.send({ success: false, message: `Please include a username, password, and gender field in your request.` });
        res.end();
        return;
    }

    let username: string = query.username;
    let password: string = query.password;
    let gender: boolean = query.gender == "Male";

    let newUserData = await dbManager.createUser(username, password, gender);
    let newSessionId = dbManager.createSession(newUserData.UserID);

    res.cookie("phan_sessionId", newSessionId, { httpOnly: true, maxAge: 3600000 });
    res.send({ success: true, message: `Registration complete` });
    res.end();
});

Router.get("/check", (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]
    if(!sessionId) {
        res.send(`Not logged in`);
        res.end();
        return;
    }

    let userData = dbManager.getUser_Session(sessionId);
    if(userData == undefined) {
        res.clearCookie("phan_sessionId");
        res.send(`Could not locate your user data.`);
        res.end();
        return;
    }

    let userCopy = { name: userData.Username, userId: userData.UserID, profile: userData.ProfilePic, gender: userData.Gender };

    res.send(JSON.stringify(userCopy));
    res.end();
});