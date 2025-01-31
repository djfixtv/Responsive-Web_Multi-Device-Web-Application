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
    });

    // Cache all user information for mass post retrieval
    connectionPool.query(`SELECT * FROM users`, (err: mysql.MysqlError, rows: PhanUser[], fields: mysql.FieldInfo[]) => {
        if(err) return;
        rows.forEach(row => { userCache.set(row.UserID, row); });
    });
}

// Type declarations

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

export type PhanFullPost = {
    ID: number,
    PostID: string,
    OwnerID: string,
    OwnerName: string,
    OwnerPFP: string,
    Content: string
}

export type PhanSession = {
    sessionId: string,
    userId: string
}

const userCache = new Map<string, PhanUser>();  // User ID => Phansite User (Update every time we bother the database)
const sessionMap = new Map<string, PhanUser>(); // Session ID => Phansite User

// Creating and retreiving users

export const createUser = (username: string, password: string, gender: boolean, profilePic: string) => { return new Promise<PhanUser>(async (resolve,reject) => {
    let passHash = await bcrypt.hash(password, 10);

    let newUserData = {
        ID: -1,
        UserID: "phan_u_" + crypto.randomUUID(),
        Username: username,
        Password: passHash,
        ProfilePic: profilePic,
        Gender: gender
    }

    try {
        let userData = await getUser_Name(username);
        reject({ message: "User exists" });
        return;
    } catch(e) {}
    
    connectionPool.query(`INSERT INTO users (UserID, Username, Password, ProfilePic, Gender) VALUES (`+
        `${mysql.escape(newUserData.UserID)}, ${mysql.escape(newUserData.Username)}, ${mysql.escape(newUserData.Password)},`+
        ` ${mysql.escape(newUserData.ProfilePic)}, ${mysql.escape(newUserData.Gender)})`
    , (err: mysql.MysqlError, result: mysql.OkPacket, fields: mysql.FieldInfo[]) => {
        if(err) { reject(err); return; }
        newUserData.ID = result.insertId;
        userCache.set(newUserData.UserID, newUserData);
        resolve(newUserData);
    });
}); }

export const getUser_Name = (username: string) => { return new Promise<PhanUser>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM users WHERE Username=${mysql.escape(username)}`, (err: mysql.MysqlError, rows: PhanUser[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        if(rows.length != 1) { reject({ message: "Account missing" }); return; }
        let userData: PhanUser = rows[0];
        userCache.set(userData.UserID, userData);
        resolve(userData);
        return;
    });
}); }

export const getUser_ID = (userId: string) => { return new Promise<PhanUser>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM users WHERE UserID=${mysql.escape(userId)}`, (err: mysql.MysqlError, rows: PhanUser[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        if(rows.length != 1) { reject({ message: "Account missing" }); return; }
        let userData: PhanUser = rows[0];
        userCache.set(userData.UserID, userData);
        resolve(userData);
        return;
    });
}); }

// Creating and retreiving posts

export const createPost = (userID: string, content: string) => { return new Promise<PhanPost>(async (resolve,reject) => {
    let user: PhanUser;
    try { user = await getUser_ID(userID); }
    catch(e) { reject(e); return; }

    let postId = "phan_p_" + crypto.randomUUID();

    connectionPool.query(`INSERT INTO posts (PostID, OwnerID, Content) VALUES (${mysql.escape(postId)}, ${mysql.escape(userID)}, ${mysql.escape(content)})`, async (err: mysql.MysqlError, result: mysql.OkPacket, fields: mysql.FieldInfo[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        console.log(`User ${user.Username} created a post: ${content}`);
        let newPost: PhanPost = {
            ID: result.insertId,
            Content: content,
            OwnerID: userID,
            PostID: postId
        }
        resolve(newPost); return;
    });
}); }

export const getPost = (postID: string) => { return new Promise<PhanFullPost>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM posts WHERE PostID=${mysql.escape(postID)}`, async (err: mysql.MysqlError, rows: PhanPost[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        if(rows.length != 1) { reject({ message: "Post missing" }); return; }
        let postData: PhanPost = rows[0];
        let ownerData = await getUser_ID(postData.OwnerID);
        let fullPostData: PhanFullPost = { ...postData, OwnerName: ownerData.Username, OwnerPFP: ownerData.ProfilePic }
        resolve(fullPostData); return;
    });
}); }

export const getAllPosts = () => { return new Promise<PhanFullPost[]>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM posts`, async (err: mysql.MysqlError, rows: PhanPost[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        let fullPosts = await Promise.all(rows.map(post => { return new Promise<PhanFullPost>(async (resolve) => {
            let cachedUserData = userCache.get(post.OwnerID);
            if(cachedUserData == undefined) cachedUserData = await getUser_ID(post.OwnerID);
            let fullPost: PhanFullPost = { ...post, OwnerName: cachedUserData.Username, OwnerPFP: cachedUserData.ProfilePic };
            resolve(fullPost);
        }); }));
        resolve(fullPosts); return;
    });
}); }

// Creating and managing sessions

export const createSession = (userId: string) => { return new Promise<string>(async (resolve, reject) => {
    const sessionId = "phan_s_"+crypto.randomUUID();
    
    let user: PhanUser;
    try { user = await getUser_ID(userId); }
    catch(e) { reject(e); return; }

    sessionMap.set(sessionId, user);
    resolve(sessionId); return;
}); }

export const clearSession = (sessionId: string) => {
    if(sessionMap.has(sessionId)) {
        sessionMap.delete(sessionId);
        return true;
    } else return false;
}

export const getUser_Session = (sessionId: string) => {
    return sessionMap.get(sessionId);
}