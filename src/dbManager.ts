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
    ProfilePIC: string,
    Gender: boolean
}

export type PhanPost = {
    ID: number,
    PostID: string,
    OwnerID: string,
    Content: string,
    PostTitle: string
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

export type PhanComment = {
    ID: number,
    Content: string,
    UserID: string,
    PostID: string,
    CommentID: string
}

export type PhanFullComment = {
    ID: number,
    Content: string,
    UserID: string,
    UserPFP: string,
    UserName: string,
    PostID: string,
    CommentID: string
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
        ProfilePIC: profilePic,
        Gender: gender
    }

    try {
        let userData = await getUser_Name(username);
        reject({ message: "User exists" });
        return;
    } catch(e) {}
    
    connectionPool.query(`INSERT INTO users (UserID, Username, Password, ProfilePIC, Gender) VALUES (`+
        `${mysql.escape(newUserData.UserID)}, ${mysql.escape(newUserData.Username)}, ${mysql.escape(newUserData.Password)},`+
        ` ${mysql.escape(newUserData.ProfilePIC)}, ${mysql.escape(newUserData.Gender)})`
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

export const createPost = (userID: string, content: string, title: string) => { return new Promise<PhanPost>(async (resolve,reject) => {
    let user: PhanUser;
    try { user = await getUser_ID(userID); }
    catch(e) { reject(e); return; }

    let postId = "phan_p_" + crypto.randomUUID();

    connectionPool.query(`INSERT INTO posts (PostID, OwnerID, Content, PostTitle) VALUES (${mysql.escape(postId)}, ${mysql.escape(userID)}, ${mysql.escape(content)}, ${mysql.escape(title)})`, async (err: mysql.MysqlError, result: mysql.OkPacket, fields: mysql.FieldInfo[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        console.log(`User ${user.Username} created a post: ${content}`);
        let newPost: PhanPost = {
            ID: result.insertId,
            Content: content,
            OwnerID: userID,
            PostID: postId,
            PostTitle: title
        }
        resolve(newPost); return;
    });
}); }

export const getPost = (postID: string) => { return new Promise<PhanFullPost>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM posts WHERE PostID=${mysql.escape(postID)}`, async (err: mysql.MysqlError, rows: PhanPost[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        if(rows.length != 1) { reject({ message: "Post missing" }); return; }
        let postData: PhanPost = rows[0];
        let ownerData: any;
        try{
            ownerData = await getUser_ID(postData.OwnerID);
        }
        catch(err){
            ownerData = { Username: "unknown user", ProfilePIC: "img/StarBG.png" }
        }
        let fullPostData: PhanFullPost = { ...postData, OwnerName: ownerData.Username, OwnerPFP: ownerData.ProfilePIC }
        resolve(fullPostData); return;
    });
}); }

export const getAllPosts = () => { return new Promise<PhanFullPost[]>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM posts`, async (err: mysql.MysqlError, rows: PhanPost[], fields: any[]) => {
        if(err) { console.log(`SQL Error!`, err); reject({ message: "SQL Error", err }); return; }
        let fullPosts = await Promise.all(rows.map(post => { return new Promise<PhanFullPost>(async (resolve) => {
            let cachedUserData: any = userCache.get(post.OwnerID);
            try{
                if(cachedUserData == undefined) cachedUserData = await getUser_ID(post.OwnerID);
            }
            catch(e){
                console.log("fail")
                cachedUserData = { Username: "unknown user", ProfilePIC: "img/StarBG.png" }
            }
            let fullPost: PhanFullPost = { ...post, OwnerName: cachedUserData.Username, OwnerPFP: cachedUserData.ProfilePIC };
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

export const createComment = (content: string, userId: string, postId: string, commentId: string) => { return new Promise<PhanComment>(async (resolve,reject)  => {
    connectionPool.query(`INSERT INTO comments (Content, UserID, PostID, CommentID) VALUES (${mysql.escape(content)}, ${mysql.escape(userId)} ,${mysql.escape(postId)}, ${mysql.escape(commentId)})`, async (err: mysql.MysqlError, res: mysql.OkPacket, fields: mysql.FieldInfo[]) => {
        if(err) { console.error(err); reject({ message: "SQL Error!", err }); return; }
        let newComment: PhanComment = {
            ID: res.insertId,
            Content: content,
            UserID: userId,
            PostID: postId,
            CommentID: commentId
        }
        resolve(newComment); return;
    });

}); }
export const retrieveComment = (commentId: string) => { return new Promise<PhanFullComment>(async (resolve,reject)  => {
    connectionPool.query(`SELECT * FROM comments WHERE CommentID=${mysql.escape(commentId)}`, async (err: mysql.MysqlError, res: any[], fields: mysql.FieldInfo[]) => {
        if(err) { console.error(err); reject({ message: "SQL Error!", err }); return; }
        if(res.length != 1) { reject({ message: "Invalid row count", err: null }); return; }
        let commentData: PhanComment = res[0];
        let senderData: any;
        try{
            senderData = await getUser_ID(commentData.UserID);
        }
        catch(err){
            senderData = { Username: "unknown user", ProfilePIC: "img/StarBG.png" }
        }
        let fullComment: PhanFullComment = { ...commentData, UserName: senderData.Username, UserPFP: senderData.ProfilePIC }
        resolve(fullComment); return;
    });

}); }
export const getCommentsOfPost = (postId: string) => { return new Promise<PhanFullComment[]>(async (resolve,reject) => {
    connectionPool.query(`SELECT * FROM comments WHERE PostID=${mysql.escape(postId)}`, async (err: mysql.MysqlError, rows: any[], fields: mysql.FieldInfo[]) => {
        if(err) { console.error(err); reject({ message: "SQL Error!", err }); return; }
        let fullComments = await Promise.all(rows.map(comment => { return new Promise<PhanFullComment>(async (resolve) => {
            let cachedUserData: any = userCache.get(comment.OwnerID);
            try{
                if(cachedUserData == undefined) cachedUserData = await getUser_ID(comment.UserID);
            }
            catch(e){
                console.log("fail")
                cachedUserData = { Username: "unknown user", ProfilePIC: "img/StarBG.png" }
            }
            let fullPost: PhanFullComment = { ...comment, UserName: cachedUserData.Username, UserPFP: cachedUserData.ProfilePIC };
            resolve(fullPost);
            
        }); }));
        resolve(fullComments); return;
    });

}); }