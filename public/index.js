const socket = io();

socket.on("connect", () => { console.log(`Server connected`); });
socket.on("disconnect", () => { console.warn(`Server disconnected`); });

socket.on("chatMessage", (data) => {console.log("Persona Message: ", data)});

function sendPersonaMessage(data) {
    socket.emit("chatMessage", data);
}


