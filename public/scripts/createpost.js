const InputTitle = document.getElementById("title");
const InputContent = document.getElementById("body");
const SubmitPost = document.getElementById("submitpost");

SubmitPost.onclick = async (e) => {
    const response = await (await fetch(`/api/makePost?title=${encodeURIComponent(InputTitle.value)}&content=${encodeURIComponent(InputContent.value)}`, { method: "POST" })).text();
    console.log(response);
    if(response.success == true) window.location.href = `${window.location.protocol}//${window.location.host}/forum`;
    else {window.location.href = `${window.location.protocol}//${window.location.host}/login`};
   
}