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
    chatList.forEach(chat=>{
        var html=createChatHtml(chat);
        container.append(html);
    })
    if(chatList.length==0){
        container.append("<span class='noResults'>Nothing to show.</span>")
    }
}

function createChatHtml(chatData){
    var chatName=getChatName(chatData);
    var image="";
    var latestMessage="This is the latest message"
    return `<a class='resultListItem' href='/messages/${chatData._id}'>
                <div class='resultsDetailsContainer'>
                    <span class="heading">${chatName}</span>
                    <span class="subText">${latestMessage}</span>
                </div>
            </a>`
}

function getChatName(chatData){
    var chatName=chatData.chatName;
    if(!chatName){
        var otherChatUsers=getOtherChatUsers(chatData.users);
        var namesArray=otherChatUsers.map(user=>user.firstname+" "+user.lastname)
        chatName=namesArray.join(", ")
    }
    return chatName;
}

function getOtherChatUsers(users){
    if(users.length==1) return users;
    return users.filter(user=>user._id!=userLoggedIn._id)
}