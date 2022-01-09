$(document).ready(()=>{
    if(selectedTab==="replies"){
        loadReplies();
    }else{
        loadPosts();
    }
});
function loadPosts(){
    $.get("/api/posts", {postedBy:profileUserId,pinned:true}, results=>{
        OutputPinnedPosts(results,$(".pinnedPostContainer"));
    })

    $.get("/api/posts", {postedBy:profileUserId, isReply:false}, results=>{
        OutputPosts(results,$(".postsContainer"));
    })
}
function loadReplies(){
    $.get("/api/posts", {postedBy:profileUserId, isReply:true}, results=>{
        OutputPosts(results,$(".postsContainer"));
    })
}

function OutputPinnedPosts(results,container){
    if(results.length==0){
        container.hide();
        return;
    }
    container.html("");

    results.forEach(result => {
        var html=createPostHtml(result)
        container.append(html)
    });
}