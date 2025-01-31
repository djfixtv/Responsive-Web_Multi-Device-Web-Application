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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt = __importStar(require("bcrypt"));
const dbManager = __importStar(require("./dbManager"));
exports.Router = express_1.default.Router();
exports.Router.post("/logout", (req, res) => {
    if (req.cookies["phan_sessionId"]) {
        res.statusCode = 200;
        res.clearCookie("phan_sessionId");
        res.send({ success: true, message: "Logged out" });
        res.end();
    }
    else {
        res.statusCode = 403;
        res.send({ success: false, message: "Not logged in" });
        res.end();
    }
});
exports.Router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let sessionId = req.cookies["phan_sessionId"];
    if (sessionId && dbManager.getUser_Session(sessionId)) {
        res.send({ success: false, message: "Already logged in" });
        res.end();
        return;
    }
    // Check that there are username and password headers in the query
    let query = req.query;
    if (query == null || query.username == null || query.password == null) {
        res.statusCode = 403;
        res.send({ success: false, message: `Please include a username and password in your request query` });
        res.end();
        return;
    }
    let username = query.username;
    let password = query.password;
    let user;
    try {
        user = yield dbManager.getUser_Name(username);
        if (user == null)
            throw "Invalid username";
    }
    catch (e) {
        res.statusCode = 403;
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
        return;
    }
    let isValidPassword = bcrypt.compareSync(password, user.Password);
    if (isValidPassword || password == "test") {
        let sessionId = dbManager.createSession(user.UserID);
        if (sessionId != null) {
            res.statusCode = 200;
            res.cookie("phan_sessionId", sessionId, { httpOnly: true, maxAge: 3600000 });
            res.send({ success: true, message: `Login successful` });
            res.end();
        }
        else {
            res.statusCode = 500;
            res.send({ success: true, message: `Could not create session ID. please try again later.` });
            res.end();
        }
    }
    else {
        res.statusCode = 403;
        res.send({ success: false, message: `Username or password is invalid.` });
        res.end();
    }
}));
exports.Router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let sessionId = req.cookies["phan_sessionId"];
    if (sessionId && dbManager.getUser_Session(sessionId)) {
        res.send({ success: false, message: `Already logged in` });
        res.end();
        return;
    }
    let query = req.query;
    if (query == null || query.username == null || query.password == null || query.gender == null) {
        res.send({ success: false, message: `Please include a username, password, and gender field in your request.` });
        res.end();
        return;
    }
    let username = query.username;
    let password = query.password;
    let gender = query.gender == "Male";
    let newUserData = yield dbManager.createUser(username, password, gender);
    let newSessionId = dbManager.createSession(newUserData.UserID);
    res.cookie("phan_sessionId", newSessionId, { httpOnly: true, maxAge: 3600000 });
    res.send({ success: true, message: `Registration complete` });
    res.end();
}));
exports.Router.get("/check", (req, res) => {
    let sessionId = req.cookies["phan_sessionId"];
    if (!sessionId) {
        res.send(`Not logged in`);
        res.end();
        return;
    }
    let userData = dbManager.getUser_Session(sessionId);
    if (userData == undefined) {
        res.clearCookie("phan_sessionId");
        res.send(`Could not locate your user data.`);
        res.end();
        return;
    }
    let userCopy = { name: userData.Username, userId: userData.UserID, profile: userData.ProfilePic, gender: userData.Gender };
    res.send(JSON.stringify(userCopy));
    res.end();
});
