const registerButton = document.getElementById("register");
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const maleRadio = document.getElementById("gender1");
const femaleRadio = document.getElementById("gender2");
const errorPopup = document.getElementById("errorpopup");
const errorButton = document.getElementById("okbutton");
const errortext = document.getElementById("errortext");

const showError = (message) => { errortext.textContent = message; errorPopup.style.display = "flex"; }
const hideError = () => { errorPopup.style.display = "none"; }

errorButton.onclick = (e) => { hideError(); }

registerButton.onclick = async (e) => {
    maleRadio.disabled = true;
    femaleRadio.disabled = true;
    usernameField.disabled = true;
    passwordField.disabled = true;
    registerButton.disabled = true;
   
    
    let gender = "Female";
    if(maleRadio.checked) gender = "Male";
    let response = (await (await fetch(`/api/register?username=${encodeURIComponent(usernameField.value)}&password=${encodeURIComponent(passwordField.value)}&gender=${gender}`, { method: "POST" })).json())
    
    console.log(response);
    if(response.success == true) window.location.href = `/home`
    else showError(response.message);

    maleRadio.disabled = false;
    femaleRadio.disabled = false;
    usernameField.disabled = false;
    passwordField.disabled = false;
    registerButton.disabled = false;
}

[usernameField, passwordField].forEach(field => {
    field.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            registerButton.click();
        }
    })
})