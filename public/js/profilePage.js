$(document).ready(()=>{
    if(selectedTab==="replies"){
        loadReplies();
    }else{
        loadPosts();
    }
});
function loadPosts(){
    $.get("/api/posts", {postedBy:profileUserId, isReply:false}, results=>{
        OutputPosts(results,$(".postsContainer"));
    })
}
function loadReplies(){
    $.get("/api/posts", {postedBy:profileUserId, isReply:true}, results=>{
        OutputPosts(results,$(".postsContainer"));
    })
}