const postContainer = document.getElementById("page");
const postTemplate = document.getElementById("post-template");
const postMap = new Map();
postCount = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const existingPosts = await (await fetch(
        window.location.protocol + "//" + window.location.host + "/api/retrieveAllPosts"
    )).json();
    console.log(existingPosts);
    // existingPosts.forEach(postData => {
    //     const postDetails = {
    //         content: postData.content
    //         username: postData
    //     }
    // })
});

function createPost(content, username, profilepic, postid) {
    if(postMap.has(postid)) return; // Don't create two of the same post in the page

    let newPost = postTemplate.cloneNode(true);
    newPost.id = `post${postCount}`
    postContainer.appendChild(newPost);
    
}