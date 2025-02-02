const commentContainer = document.getElementById("comment-container");
const commentTemplate = document.getElementById("comment-template");
const commentMap = new Map();
const postMain = document.getElementById("post-main")
const commentButton = document.getElementById("comment-sendBtn")
const commentField = document.getElementById("comment-textarea")
commentCount = 0;

// Filter the page URL for just the post ID
let queries = window.location.search.substring(1).split("&");
let idPair = queries.map(query => { return query.split("="); }).filter(pair => { return pair[0] == "id"; })[0];
if(idPair == null) window.location.href = "/forum";
idPair[0] = decodeURIComponent(idPair[0]);
idPair[1] = decodeURIComponent(idPair[1]);
let currentPostId = idPair[1];
console.log(`Looking at post:`,currentPostId);

document.addEventListener("DOMContentLoaded", async () => {
    const postData = await (await fetch("/api/retrievePost?postID=" + encodeURIComponent(currentPostId))).json()
    console.log(postData);
    profile_img = postMain.children[0].children[0];
    username_txt = postMain.children[0].children[1];
    content_txt = postMain.children[3];
    title_txt = postMain.children[1].children[0];

    profile_img.src = postData.postData.OwnerPFP;
    username_txt.textContent = postData.postData.OwnerName;
    content_txt.textContent = postData.postData.Content;
    content_txt.innerHTML = content_txt.innerHTML.replace(/\n/g, "<br>")
    title_txt.textContent = postData.postData.PostTitle;
    title_txt.innerHTML = title_txt.innerHTML.replace(/\n/g, "<br>")
    
    const comments = await (await fetch("/api/retrieveComments?postID=" + encodeURIComponent(currentPostId))).json()
    console.log(comments);
    if(comments.success) comments.comments.forEach(comment => {
        createComment(comment.Content, comment.UserName, comment.UserPFP, comment.CommentID);
    });
});

function createComment(content, username, profilepic, commentId) {
    if(commentMap.has(commentId)) return; // Don't create two of the same post in the page

    let newComment = commentTemplate.cloneNode(true);

    profile_img = newComment.children[0].children[0].children[0];
    username_txt = newComment.children[0].children[0].children[1];
    content_txt = newComment.children[0].children[1];

    newComment.id = `comment-${commentCount}`;
    profile_img.src = profilepic;
    username_txt.textContent = username;
    content_txt.textContent = content;
    content_txt.innerHTML = content_txt.innerHTML.replace(/\n/g, "<br>")

    commentCount++;

    commentMap.set(commentId, newComment)

    // postContainer.appendChild(newPost);
    commentContainer.appendChild(newComment);
    
}

commentButton.onclick = async (e) => {
    let sendResult = await (await fetch(`/api/makeComment?postID=${currentPostId}&content=${encodeURIComponent(commentField.value)}`, { method: "POST" })).json();
    if(sendResult.success) { commentField.value = ""; }
    else window.location.href = "/login"
}

socket.on("commentMade", (commentData) => { if(commentData.PostID == currentPostId) createComment(commentData.Content, commentData.UserName, commentData.UserPFP, commentData.CommentID); else console.warn("Comment is for another post. Ignoring", commentData); });