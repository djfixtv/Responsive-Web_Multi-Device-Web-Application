import express from "express";
import http from "http";
import path from "path";

const app = express();
const server = http.createServer(app);

app.all("*", (req, res, next) => {
    if(req.socket.remoteAddress == null) { return; }
    console.log(`${req.method.toUpperCase()} Request by ${req.socket.remoteAddress.replace("::ffff:","")} for ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname,"../public")));

app.get("*", (req, res) => { res.statusCode = 404; res.send(`Missing file`); res.end(); });
app.all("*", (req, res) => { res.statusCode = 403; res.send(`Unknown Endpoint`); res.end(); });


let port = 80;
server.on("listening", () => { console.log(`Server is now listening on port ${port}`); });
server.listen(port);