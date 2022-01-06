$(document).ready(()=>{
    $.get("/api/posts/" + postId, results=>{
        OutputPostsWithReplies(results,$(".postsContainer"));
    })  
})  