$(document).ready(()=>{
    if(selectedTab==="followers"){
        loadFollowers();
    }else{
        loadFollowing();
    }
});
function loadFollowers(){
    $.get(`/api/users/${profileUserId}/followers`, results=>{
        outputUsers(results.followers,$(".resultsContainer"));
    })
}
function loadFollowing(){
    $.get(`/api/users/${profileUserId}/following`, results=>{
        outputUsers(results.following,$(".resultsContainer"));
    })
}

function outputUsers(results,container){
    container.html("");

    results.forEach(result=>{
        var html=createUserhtml(result,true);
        container.append(html);
    })
    if(results.length===0){
        container.append("<span class='noResults'>No results found</span>")
    }

}

function createUserhtml(userData,showFollowButton){
    var name=userData.firstname +" "+ userData.lastname;
    return `<div class="user">
                <div class="userImageContainer">
                    <img src="${userData.profilePic}">
                </div>
                <div class="userDetailsContainer">
                    <div class="header">
                        <a href="/profile/${userData.username}">${name}</a>
                        <span classs="username">@${userData.username}</span>
                    </div>
                </div>
            </div>`;
}