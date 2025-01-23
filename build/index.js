"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.all("*", (req, res, next) => {
    if (req.socket.remoteAddress == null) {
        return;
    }
    console.log(`${req.method.toUpperCase()} Request by ${req.socket.remoteAddress.replace("::ffff:", "")} for ${req.url}`);
    next();
});
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("*", (req, res) => { res.statusCode = 404; res.send(`Missing file`); res.end(); });
app.all("*", (req, res) => { res.statusCode = 403; res.send(`Unknown Endpoint`); res.end(); });
let port = 80;
server.on("listening", () => { console.log(`Server is now listening on port ${port}`); });
server.listen(port);
