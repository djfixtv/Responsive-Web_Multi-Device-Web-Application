import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";
import * as mysql from "mysql";

let connectionPool: mysql.Pool;
export const initialize = () => {
  connectionPool = mysql.createPool({
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DATABASE,
    connectionLimit: 10
  })
}


export type PhanUser = {
    ID: number,
    UserID: string,
    Username: string,
    Password: string,
    ProfilePic: string,
    Gender: boolean
}

export type PhanPost = {
    ID: number,
    PostID: string,
    OwnerID: string,
    Content: string
}

export type PhanSession = {
    sessionId: string,
    userId: string
}

const nameMap = new Map<string, PhanUser>();    // User name => Phansite User
const userMap = new Map<string, PhanUser>();    // User ID => Phansite User
const sessionMap = new Map<string, PhanUser>(); // Session ID => Phansite User
const postMap = new Map<string, PhanPost>();    // Post ID => Phansite Post

export const createUser = (username: string, password: string, gender: boolean) => { return new Promise<PhanUser>(async (resolve,reject) => {
let passHash = await bcrypt.hash(password, 10);

    let newUserData: PhanUser = {
        ID: userMap.size + 1,
        UserID: "phan_u_" + crypto.randomUUID(),
        Username: username,
        Password: passHash,
        ProfilePic: "unknown.png",
        Gender: gender
    }
    
    nameMap.set(newUserData.Username, newUserData);
    userMap.set(newUserData.UserID, newUserData);
    resolve(newUserData);
}); }

export const getUser_Name = (username: string) => { return new Promise<PhanUser>(async (resolve,reject) => { /* TODO: Pull user data using username */ }); }

export const getUser_ID = (userID: string) => { return new Promise<PhanUser>(async (resolve,reject) => { /* TODO: Pull user data using User ID */ }); }

export const createPost = (userID: string, content: string) => { return new Promise<PhanPost>(async (resolve,reject) => { /* TODO: Insert new post into database */ }); }

export const getPost = (postID: string) => { return new Promise<PhanPost>(async (resolve,reject) => { /* TODO: Pull post with specific ID from database */ }); }

export const getAllPosts = () => { return new Promise<PhanPost[]>(async (resolve,reject) => { /* TODO: Pull all posts from database */ }); }

export const createSession = (userId: string) => {
    const sessionId = "phan_s_"+crypto.randomUUID();
    let user: PhanUser | undefined = userMap.get(userId);
    if(user == undefined) return undefined;
    sessionMap.set(sessionId, user);
    return sessionId;
}

export const clearSession = (sessionId: string) => {
    if(sessionMap.has(sessionId)) {
        sessionMap.delete(sessionId);
        return true;
    } else return false;
}

export const getUser_Session = (sessionId: string) => {
    return sessionMap.get(sessionId);
}