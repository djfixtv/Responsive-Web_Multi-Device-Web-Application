const InputTitle = document.getElementById("title");
const InputContent = document.getElementById("body");
const SubmitPost = document.getElementById("submitpost");

SubmitPost.onclick = async (e) => {
    if(InputContent.value.replace(/[\ \n]/g, "").length < 2) return;
    if(InputTitle.value.replace(/[\ \n]/g, "").length < 2) return;
    const response = await (await fetch(`/api/makePost?title=${encodeURIComponent(InputTitle.value)}&content=${encodeURIComponent(InputContent.value)}`, { method: "POST" })).json();
    console.log(response);
    if(response.success == true) window.location.href = `/post?id=${response.postData.PostID}`;
    else {window.location.href = `${window.location.protocol}//${window.location.host}/login`};
   
}