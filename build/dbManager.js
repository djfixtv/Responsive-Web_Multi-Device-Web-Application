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
};
exports.initialize = initialize;
const nameMap = new Map(); // User name => Phansite User
const userMap = new Map(); // User ID => Phansite User
const sessionMap = new Map(); // Session ID => Phansite User
const postMap = new Map(); // Post ID => Phansite Post
const createUser = (username, password, gender) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let passHash = yield bcrypt.hash(password, 10);
        let newUserData = {
            ID: userMap.size + 1,
            UserID: "phan_u_" + crypto.randomUUID(),
            Username: username,
            Password: passHash,
            ProfilePic: "unknown.png",
            Gender: gender
        };
        nameMap.set(newUserData.Username, newUserData);
        userMap.set(newUserData.UserID, newUserData);
        resolve(newUserData);
    }));
};
exports.createUser = createUser;
const getUser_Name = (username) => { return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () { })); };
exports.getUser_Name = getUser_Name;
const getUser_ID = (userID) => { return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () { })); };
exports.getUser_ID = getUser_ID;
const createPost = (userID, content) => { return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () { })); };
exports.createPost = createPost;
const getPost = (postID) => { return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () { })); };
exports.getPost = getPost;
const getAllPosts = () => { return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () { })); };
exports.getAllPosts = getAllPosts;
const createSession = (userId) => {
    const sessionId = "phan_s_" + crypto.randomUUID();
    let user = userMap.get(userId);
    if (user == undefined)
        return undefined;
    sessionMap.set(sessionId, user);
    return sessionId;
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
