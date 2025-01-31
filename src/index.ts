import express from "express";
import http from "http";
import path from "path";
import * as sio from "socket.io";
import * as dotenv from "dotenv";
import * as dbManager from "./dbManager";
import { Router as apiRouter } from "./apiRouter";

dotenv.config({ path: path.join(__dirname,`../.env`) });
dbManager.initialize();
const cookieParser = require("cookie-parser");


const app = express();
const server = http.createServer(app);

export const ios = new sio.Server(server);

app.use(cookieParser());
app.use("/api", apiRouter);
app.all("*", (req, res, next) => {
    if(req.socket.remoteAddress == null) { return; }
    console.log(`${req.method.toUpperCase()} Request by ${req.socket.remoteAddress.replace("::ffff:","")} for ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname,"../public")));


// Serve HTML files without .html in the URL
app.get("/:page", (req, res) => {
    const pagePath = path.join(__dirname, "../public", req.params.page + ".html");

    res.sendFile(pagePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, "../public/error.html"));
        }
    });
});

// Redirect requests with .html to clean URLs
app.get("/:page.html", (req, res) => {
    res.redirect(301, `/${req.params.page}`);
});

// Catch-all for 404 errors
app.get("*", (req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../public/error.html"));
});


// app.get("*", (req, res) => { res.statusCode = 404; res.sendFile(path.join(__dirname,"../public/error.html")); });
app.all("*", (req, res) => { res.statusCode = 403; res.send(`Unknown Endpoint`); res.end(); });

ios.on("connect", (socket) => {
    console.log(`Socket connected from ${socket.conn.remoteAddress.replace("::ffff:","")}`);
    socket.on("disconnect", () => { console.log(`Socket disconnect ${socket.conn.remoteAddress.replace("::ffff:","")}`); });
    
    socket.on("chatMessage", data => {
        console.log(`<${socket.conn.remoteAddress.replace("::ffff:","")}>:`,data);
        socket.broadcast.emit("chatMessage", data);
    });
});

let port = Number(process.env.PORT);
server.on("listening", () => { console.log(`Server is now listening on port ${port}`); });
server.listen(port);