const socket = io();
const logoutButton = document.getElementById("logoutbutton");
const logoutPopup = document.getElementById("logoutpopup");
const yesbutton = document.getElementById("logoutyes");
const nobutton = document.getElementById("logoutno");
const userInfo = document.getElementById("userinfo");


const showLogoutPopup = () => {logoutPopup.style.display = "flex";};
const hideLogoutPopup = () => {logoutPopup.style.display = "none";};

socket.on("connect", () => { console.log(`Server connected`); });
socket.on("disconnect", () => { console.warn(`Server disconnected`); });

socket.on("chatMessage", (data) => {console.log("Persona Message: ", data)});



function sendPersonaMessage(data) {
    socket.emit("chatMessage", data);
}

let userData = {}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        let response = await (await fetch(`${window.location.protocol}//${window.location.host}/api/check`)).json()
        const userLoginData = response.userData;

        if(userLoginData) {
            logoutButton.style.display = "flex";
            userInfo.style.display = "flex";

            profile_img = userInfo.children[0];
            username_txt = userInfo.children[1];

            profile_img.src = userLoginData.profile;
            username_txt.textContent = userLoginData.name;
            console.log(userLoginData);
            } 

            else {
                logoutButton.style.display = "none";
                userInfo.style.display = "none";
            }

        }
    catch (error) {
        console.log("Error fetching user data")
    }

    
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

// function showUserInfo() {
    
// }