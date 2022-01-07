$(document).ready(()=>{
    if(selectedTab==="followers"){
        loadFollowers();
    }else{
        loadFollowing();
    }
});
function loadFollowers(){
    $.get(`/api/users/${profileUserId}/followers`, results=>{
        outputUsers(results,$(".resultsContainer"));
    })
}
function loadFollowing(){
    $.get(`/api/users/${profileUserId}/following`, results=>{
        outputUsers(results,$(".resultsContainer"));
    })
}

function outputUsers(data,container){
    console.log(data)
}