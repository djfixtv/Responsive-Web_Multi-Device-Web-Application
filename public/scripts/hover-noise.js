document.addEventListener("DOMContentLoaded", () => {
    const originalAudio = document.getElementById("HoverSound");
    const buttons = [...document.querySelectorAll("a.nav-btn"), document.querySelector("#okbutton"), document.querySelector("#register"), ...document.querySelectorAll("button"), document.querySelector("#logoutbutton")]

    buttons.forEach(button => {
        if(button == undefined) return;
        try{
            button.addEventListener("mouseover", () => {
                // Clone the original audio element
                const clonedAudio = originalAudio.cloneNode(true);
                // Append the cloned audio element to the body
                document.body.appendChild(clonedAudio);
                // Play the cloned audio
                clonedAudio.play();
                
                // Remove the cloned audio element once it has finished playing
                clonedAudio.addEventListener("ended", () => {
                    document.body.removeChild(clonedAudio);
                });
            });
        }
        catch(e) {
            console.warn("Failed to add event to button:",button,e);
        }
        
    });
});