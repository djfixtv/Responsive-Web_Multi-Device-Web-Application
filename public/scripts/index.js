const socket = io();
const logoutButton = document.getElementById("logoutbutton")
const logoutPopup = document.getElementById("logoutpopup")
const yesbutton = document.getElementById("logoutyes")
const nobutton = document.getElementById("logoutno")


const showLogoutPopup = () => {logoutPopup.style.display = "flex";}
const hideLogoutPopup = () => {logoutPopup.style.display = "none";}

socket.on("connect", () => { console.log(`Server connected`); });
socket.on("disconnect", () => { console.warn(`Server disconnected`); });

socket.on("chatMessage", (data) => {console.log("Persona Message: ", data)});



function sendPersonaMessage(data) {
    socket.emit("chatMessage", data);
}

let userData = {}
document.addEventListener("DOMContentLoaded", async () => {
    let response = await (await fetch(`${window.location.protocol}//${window.location.host}/api/check`)).json()
    if(response.userData) {
        logoutButton.style.display = "flex";
        userData = response.userData;
    } else logoutButton.style.display = "none";
});
logoutButton.onclick = (e) => {
    showLogoutPopup();
}
yesbutton.onclick = async (e) => {
    const LogoutResponse = await (await fetch(`http://localhost:81/api/logout`, { method: "POST" })).json()
    console.log(LogoutResponse)
    location.reload()
}
nobutton.onclick = (e) => {
    hideLogoutPopup();
}