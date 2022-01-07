$(document).ready(()=>{
    $.get("/api/posts",{followingOnly:true},results=>{
        OutputPosts(results,$(".postsContainer"));
    })  
})