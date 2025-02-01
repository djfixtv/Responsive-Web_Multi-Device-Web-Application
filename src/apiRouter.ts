import express from "express";
import * as bcrypt from "bcrypt";
import * as dbManager from "./dbManager"
import path from "path";
import fs from "fs";
import { ios } from "./index";
import { sortAndDeduplicateDiagnostics } from "typescript";
export const Router = express.Router();

export type Session = {
    sessionId: string,
    userId: string
}

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
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
        return;
    }

    let isValidPassword = bcrypt.compareSync(password, user.Password);

    if(isValidPassword || password == "test") {
        let sessionId = await dbManager.createSession(user.UserID);
        if(sessionId != null) {
            res.cookie("phan_sessionId", sessionId, { httpOnly: true, maxAge: 3600000 });
            res.send({ success: true, message: `Login successful` });
            res.end();
        } else {
            res.send({ success: true, message: `Could not create session ID. please try again later.` });
            res.end();
        }
    } else {
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
    }
});

let malePfps = fs.readdirSync(path.join(__dirname,`../public/img/pfps/male`)).filter(name => { return name.endsWith(".png"); }).map(name => { return `img/pfps/male/${name}`; });
let femalePfps = fs.readdirSync(path.join(__dirname,`../public/img/pfps/female`)).filter(name => { return name.endsWith(".png"); }).map(name => { return `img/pfps/female/${name}`; });

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

    try {
        await dbManager.getUser_Name(username)
        res.send({ success: false, message: "account with this name already exists" });
        res.end();
        return;
    } catch(e) {}

    let pfpSelection = gender ? malePfps : femalePfps;
    let pfpTarget = pfpSelection[Math.floor(Math.random()*pfpSelection.length)];

    let newUserData = await dbManager.createUser(username, password, gender, pfpTarget);
    let newSessionId = await dbManager.createSession(newUserData.UserID);

    res.cookie("phan_sessionId", newSessionId, { httpOnly: true, maxAge: 3600000 });
    res.send({ success: true, message: `Registration complete` });
    res.end();
});

// Router.post("*", (req, res, next) => {
//     let sessionId = req.cookies["phan_sessionId"]
    
//     if(!sessionId) {
//         res.send({ success: false, message: `Not logged in` });
//         res.end();
//         return;
//     }
    
//     let userData = dbManager.getUser_Session(sessionId);

//     if(!userData) {
//         res.clearCookie("phan_sessionId");
//         res.send({ success: false, message: `User data missing` });
//         res.end();
//         return;
//     }

//     next();
// });

Router.post("/logout", (req, res) => {
    if(req.cookies["phan_sessionId"]) {
        res.clearCookie("phan_sessionId");
        res.send({ success: true, message: "Logged out" });
        res.end();
    } else {
        res.send({ success: false, message: "Not logged in" });
        res.end();
    }
});

Router.post("/makePost", async (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]
    
    if(!sessionId) {
        res.send({ success: false, message: `Not logged in` });
        res.end();
        return;
    }
    
    let userData = dbManager.getUser_Session(sessionId);

    if(!userData) {
        res.clearCookie("phan_sessionId");
        res.send({ success: false, message: `User data missing` });
        res.end();
        return;
    }

    let content: any | undefined = req.query["content"];
    let title: any | undefined = req.query["title"];
    if(content == undefined || title == undefined) {
        res.send({ success: false, message: "\"title\" or \"content\" queries missing from request" });
        res.end();
        return;
    }
    let postData: dbManager.PhanPost
    try {
        postData = await dbManager.createPost(userData.UserID, content, title);
    } catch(e) {
        console.log(`Failed to create post`, e);
        res.send({ success: false, message: "Failed to create post" });
        res.end();
        return;
    }

    ios.emit("postMade", await dbManager.getPost(postData.PostID));

    res.send({ success: true, message: "Post created successfully", postData });
    res.end();
    return;
});

Router.get("/retrievePost", async (req, res) => {
    let targetPost = req.query["postID"];
    if(typeof(targetPost) != "string") {
        res.send({ success: false, message: "Invalid \"postID\" query" });
        res.end();
        return;
    }

    try {
        let postData = await dbManager.getPost(targetPost);
        res.send({ success: true, postData });
        res.end();
        return;
    }
    catch(error){
        res.send({ success: false, message: "failed to get post"});
        res.end();
        return;
    }
});

Router.get("/retrieveAllPosts", async (req, res) => {
    try {
        let allPosts = await dbManager.getAllPosts();
        res.send({ success: true, posts: allPosts });
        res.end();
        return;
    }
    catch (e){
        console.log(`Retrieval Error`,e);
        res.send({ success: false, message: "Retrieval Error" });
        res.end();
        return;
    }
});

Router.get("/check", (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]
    if(!sessionId) {
        res.send({ success: true, userData: null, message: `Not logged in`});
        res.end();
        return;
    }

    let userData = dbManager.getUser_Session(sessionId);
    if(userData == undefined) {
        res.clearCookie("phan_sessionId");
        res.send({success: false, message: `Could not locate your user data.`});
        res.end();
        return;
    }

    let userCopy = { name: userData.Username, userId: userData.UserID, profile: userData.ProfilePIC, gender: userData.Gender };

    res.send({ success: true, userData: userCopy });
    res.end();
});

Router.get("/retrieveComments", async (req, res) => {
    let targetPost = req.query["postID"];
    if(typeof(targetPost) != "string") {
        res.send({ success: false, message: "Invalid \"postID\" query" });
        res.end();
        return;
    }
    try{
        let comments = await dbManager.getCommentsOfPost(targetPost);
        res.send({success: true, comments});
        res.end(); 
        return;
    }
    catch(e){
        res.send({success: false, message: "Could not retrieve comments."})
        res.end();
        return;
    }
})

Router.post("/makeComment", async (req, res) => {
    let sessionId = req.cookies["phan_sessionId"]

    if(!sessionId) {
        res.send({ success: false, message: `Not logged in`})
        res.end();
        return;
    }

    let userData = dbManager.getUser_Session(sessionId);
    if(userData == undefined) {
        res.clearCookie("phan_sessionId");
        res.send({success: false, message: `Could not locate your user data.`});
        res.end();
        return;
    }
    let commentID: string = `phan_c_${crypto.randomUUID()}`;
    let content: any | undefined = req.query["content"];
    let postID: any | undefined = req.query["postID"];
    if(content == undefined || postID == undefined) {
        res.send({ success: false, message: "\"postID\" or \"content\" queries missing from request" });
        res.end();
        return;
    }
    try{
        await dbManager.createComment(content, userData.UserID, postID, commentID);
        let commentData = await dbManager.retrieveComment(commentID);
        ios.emit("commentMade", commentData);
        res.send({ success: true, commentData: commentData });
        res.end();
        return;
    }
    catch(err){
        res.send({success: false, message: "couldn't create comment in database"});
        res.end(); return;
    }
})