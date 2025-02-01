const postContainer = document.getElementById("posts-container");
const postTemplate = document.getElementById("post-template");
const postMap = new Map();
postCount = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const existingPosts = await (await fetch("/api/retrieveAllPosts")).json()
    console.log(existingPosts);
    existingPosts.posts.forEach(postData => {
            createPost(postData.Content, postData.OwnerName, postData.OwnerPFP, postData.PostID, postData.PostTitle)
        
    })
});

function createPost(content, username, profilepic, postid, title) {
    if(postMap.has(postid)) return; // Don't create two of the same post in the page

    let newPost = postTemplate.cloneNode(true);

    profile_img = newPost.children[0].children[0];
    username_txt = newPost.children[0].children[1];
    content_txt = newPost.children[3];
    title_txt = newPost.children[1].children[0];

    newPost.id = `post-${postCount}`;
    profile_img.src = profilepic;
    username_txt.textContent = username;
    content_txt.textContent = content;
    title_txt.textContent = title;
    newPost.href = `post?id=${postid}`;

    postCount++;

    postMap.set(postid, newPost)

    // postContainer.appendChild(newPost);
    postContainer.prepend(newPost);
    
}

socket.on("postMade", (postData) => {createPost(postData.Content, postData.OwnerName, postData.OwnerPFP, postData.PostID, postData.PostTitle)})