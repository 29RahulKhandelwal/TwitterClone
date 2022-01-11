$(document).ready(()=>{
    $.get("/api/chats",(data,status,xhr)=>{
        if(xhr.status==400){
            alert("Could not get chat list")
        }else{
            outputChatList(data,$(".resultsContainer"));
        }
    })
})

function outputChatList(chatList,container){
    console.log(chatList);
}