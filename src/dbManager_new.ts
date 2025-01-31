import * as crypto from "node:crypto";
import * as bcrypt from "bcrypt";

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

let testUser: PhanUser = {
    ID: 1,
    UserID: "ab-cd-ef-gh",
    Username: "John Smith",
    Password: "password123",
    ProfilePic: "unknown.png",
    Gender: false
}

let testPost: PhanPost = {
    ID: 1,
    PostID: "ab-cd-ef-gh",
    OwnerID: "ab-cd-ef-gh",
    Content: "Fuck you."
}

const nameMap = new Map<string, PhanUser>();    // User name => Phansite User
const userMap = new Map<string, PhanUser>();    // User ID => Phansite User
const sessionMap = new Map<string, PhanUser>(); // Session ID => Phansite User
const postMap = new Map<string, PhanPost>();    // Post ID => Phansite Post

nameMap.set(testUser.Username, testUser);
userMap.set(testUser.UserID, testUser);
postMap.set(testPost.PostID, testPost);

export const createUser = (username: string, password: string, gender: boolean) => { return new Promise<PhanUser>(async resolve => {
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
}) }

export const getUser_Name = (username: string) => { return new Promise<PhanUser>((resolve, reject) => { let data = nameMap.get(username); if(data != undefined) resolve(data); else reject("Account missing"); }) }
export const getUser_ID = (userId: string) => { return new Promise<PhanUser>((resolve, reject) => { let data: PhanUser | undefined = userMap.get(userId); if(data != undefined) resolve(data); else reject("Account missing"); }) }
export const createPost = (content: string, userId: string) => { return new Promise<PhanPost>(resolve => { resolve(testPost); }) }
export const getPost = (postId: string) => { return new Promise<PhanPost>(resolve => { resolve(testPost); }) }
export const getAllPosts = () => { return new Promise<PhanPost>(resolve => { resolve(testPost); }) }

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