"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser_Session = exports.clearSession = exports.createSession = exports.getAllPosts = exports.getPost = exports.createPost = exports.getUser_ID = exports.getUser_Name = exports.createUser = exports.initialize = void 0;
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("node:crypto"));
const mysql = __importStar(require("mysql"));
let connectionPool;
const initialize = () => {
    connectionPool = mysql.createPool({
        host: process.env.SQL_HOST,
        port: Number(process.env.SQL_PORT),
        user: process.env.SQL_USER,
        password: process.env.SQL_PASS,
        database: process.env.SQL_DATABASE,
        connectionLimit: 10
    });
    // Cache all user information for mass post retrieval
    connectionPool.query(`SELECT * FROM users`, (err, rows, fields) => {
        if (err)
            return;
        rows.forEach(row => { userCache.set(row.UserID, row); });
    });
};
exports.initialize = initialize;
const userCache = new Map(); // User ID => Phansite User (Update every time we bother the database)
const sessionMap = new Map(); // Session ID => Phansite User
// Creating and retreiving users
const createUser = (username, password, gender, profilePic) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let passHash = yield bcrypt.hash(password, 10);
        let newUserData = {
            ID: -1,
            UserID: "phan_u_" + crypto.randomUUID(),
            Username: username,
            Password: passHash,
            ProfilePic: profilePic,
            Gender: gender
        };
        try {
            let userData = yield (0, exports.getUser_Name)(username);
            reject({ message: "User exists" });
            return;
        }
        catch (e) { }
        connectionPool.query(`INSERT INTO users (UserID, Username, Password, ProfilePic, Gender) VALUES (` +
            `${mysql.escape(newUserData.UserID)}, ${mysql.escape(newUserData.Username)}, ${mysql.escape(newUserData.Password)},` +
            ` ${mysql.escape(newUserData.ProfilePic)}, ${mysql.escape(newUserData.Gender)})`, (err, result, fields) => {
            if (err) {
                reject(err);
                return;
            }
            newUserData.ID = result.insertId;
            userCache.set(newUserData.UserID, newUserData);
            resolve(newUserData);
        });
    }));
};
exports.createUser = createUser;
const getUser_Name = (username) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        connectionPool.query(`SELECT * FROM users WHERE Username=${mysql.escape(username)}`, (err, rows, fields) => {
            if (err) {
                console.log(`SQL Error!`, err);
                reject({ message: "SQL Error", err });
                return;
            }
            if (rows.length != 1) {
                reject({ message: "Account missing" });
                return;
            }
            let userData = rows[0];
            userCache.set(userData.UserID, userData);
            resolve(userData);
            return;
        });
    }));
};
exports.getUser_Name = getUser_Name;
const getUser_ID = (userId) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        connectionPool.query(`SELECT * FROM users WHERE UserID=${mysql.escape(userId)}`, (err, rows, fields) => {
            if (err) {
                console.log(`SQL Error!`, err);
                reject({ message: "SQL Error", err });
                return;
            }
            if (rows.length != 1) {
                reject({ message: "Account missing" });
                return;
            }
            let userData = rows[0];
            userCache.set(userData.UserID, userData);
            resolve(userData);
            return;
        });
    }));
};
exports.getUser_ID = getUser_ID;
// Creating and retreiving posts
const createPost = (userID, content) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let user;
        try {
            user = yield (0, exports.getUser_ID)(userID);
        }
        catch (e) {
            reject(e);
            return;
        }
        let postId = "phan_p_" + crypto.randomUUID();
        connectionPool.query(`INSERT INTO posts (PostID, OwnerID, Content) VALUES (${mysql.escape(postId)}, ${mysql.escape(userID)}, ${mysql.escape(content)})`, (err, result, fields) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log(`SQL Error!`, err);
                reject({ message: "SQL Error", err });
                return;
            }
            console.log(`User ${user.Username} created a post: ${content}`);
            let newPost = {
                ID: result.insertId,
                Content: content,
                OwnerID: userID,
                PostID: postId
            };
            resolve(newPost);
            return;
        }));
    }));
};
exports.createPost = createPost;
const getPost = (postID) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        connectionPool.query(`SELECT * FROM posts WHERE PostID=${mysql.escape(postID)}`, (err, rows, fields) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log(`SQL Error!`, err);
                reject({ message: "SQL Error", err });
                return;
            }
            if (rows.length != 1) {
                reject({ message: "Post missing" });
                return;
            }
            let postData = rows[0];
            let ownerData = yield (0, exports.getUser_ID)(postData.OwnerID);
            let fullPostData = Object.assign(Object.assign({}, postData), { OwnerName: ownerData.Username, OwnerPFP: ownerData.ProfilePic });
            resolve(fullPostData);
            return;
        }));
    }));
};
exports.getPost = getPost;
const getAllPosts = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        connectionPool.query(`SELECT * FROM posts`, (err, rows, fields) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log(`SQL Error!`, err);
                reject({ message: "SQL Error", err });
                return;
            }
            let fullPosts = yield Promise.all(rows.map(post => {
                return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
                    let cachedUserData = userCache.get(post.OwnerID);
                    if (cachedUserData == undefined)
                        cachedUserData = yield (0, exports.getUser_ID)(post.OwnerID);
                    let fullPost = Object.assign(Object.assign({}, post), { OwnerName: cachedUserData.Username, OwnerPFP: cachedUserData.ProfilePic });
                    resolve(fullPost);
                }));
            }));
            resolve(fullPosts);
            return;
        }));
    }));
};
exports.getAllPosts = getAllPosts;
// Creating and managing sessions
const createSession = (userId) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const sessionId = "phan_s_" + crypto.randomUUID();
        let user;
        try {
            user = yield (0, exports.getUser_ID)(userId);
        }
        catch (e) {
            reject(e);
            return;
        }
        sessionMap.set(sessionId, user);
        resolve(sessionId);
        return;
    }));
};
exports.createSession = createSession;
const clearSession = (sessionId) => {
    if (sessionMap.has(sessionId)) {
        sessionMap.delete(sessionId);
        return true;
    }
    else
        return false;
};
exports.clearSession = clearSession;
const getUser_Session = (sessionId) => {
    return sessionMap.get(sessionId);
};
exports.getUser_Session = getUser_Session;
