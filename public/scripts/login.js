const loginButton = document.getElementById("login");
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const errorPopup = document.getElementById("errorpopup");
const errorButton = document.getElementById("okbutton");
const errortext = document.getElementById("errortext");

const showError = (message) => { errortext.textContent = message; errorPopup.style.display = "flex"; }
const hideError = () => { errorPopup.style.display = "none"; }

errorButton.onclick = (e) => { hideError(); }

loginButton.onclick = async (e) => {
    usernameField.disabled = true;
    passwordField.disabled = true;
    loginButton.disabled = true;
    
    let response = (await (await fetch(`${window.location.protocol}//${window.location.host}/api/login?username=${encodeURIComponent(usernameField.value)}&password=${encodeURIComponent(passwordField.value)}`, { method: "POST" })).json())
    
    console.log(response);
    if(response.success == true) window.location.href = `${window.location.protocol}//${window.location.host}/home`
    else showError(response.message);    

    usernameField.disabled = false;
    passwordField.disabled = false;
    loginButton.disabled = false;
}