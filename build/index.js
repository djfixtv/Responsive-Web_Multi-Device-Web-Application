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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const sio = __importStar(require("socket.io"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path_1.default.join(__dirname, `../.env`) });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const ios = new sio.Server(server);
app.all("*", (req, res, next) => {
    if (req.socket.remoteAddress == null) {
        return;
    }
    console.log(`${req.method.toUpperCase()} Request by ${req.socket.remoteAddress.replace("::ffff:", "")} for ${req.url}`);
    next();
});
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// Serve HTML files without .html in the URL
app.get("/:page", (req, res) => {
    const pagePath = path_1.default.join(__dirname, "../public", req.params.page + ".html");
    res.sendFile(pagePath, (err) => {
        if (err) {
            res.status(404).sendFile(path_1.default.join(__dirname, "../public/error.html"));
        }
    });
});
// Redirect requests with .html to clean URLs
app.get("/:page.html", (req, res) => {
    res.redirect(301, `/${req.params.page}`);
});
// Catch-all for 404 errors
app.get("*", (req, res) => {
    res.status(404).sendFile(path_1.default.join(__dirname, "../public/error.html"));
});
// app.get("*", (req, res) => { res.statusCode = 404; res.sendFile(path.join(__dirname,"../public/error.html")); });
app.all("*", (req, res) => { res.statusCode = 403; res.send(`Unknown Endpoint`); res.end(); });
ios.on("connect", (socket) => {
    console.log(`Socket connected from ${socket.conn.remoteAddress.replace("::ffff:", "")}`);
    socket.on("disconnect", () => { console.log(`Socket disconnect ${socket.conn.remoteAddress.replace("::ffff:", "")}`); });
    socket.on("chatMessage", data => {
        console.log(`<${socket.conn.remoteAddress.replace("::ffff:", "")}>:`, data);
        socket.broadcast.emit("chatMessage", data);
    });
});
let port = 80;
server.on("listening", () => { console.log(`Server is now listening on port ${port}`); });
server.listen(port);
