$(document).ready(()=>{
    $.get("/api/posts",results=>{
        OutputPosts(results,$(".postsContainer"));
    })  
})