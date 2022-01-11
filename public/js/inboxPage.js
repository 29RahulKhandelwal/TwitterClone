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
    var image=getChatImageElements(chatData);
    var latestMessage="This is the latest message"
    return `<a class='resultListItem' href='/messages/${chatData._id}'>
                ${image}
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

function getChatImageElements(chatData){
    var otherChatUsers=getOtherChatUsers(chatData.users);
    var groupChatClass="";
    var chatImage=getUserChatImageElement(otherChatUsers[0])

    if(otherChatUsers.length>1){
        groupChatClass="groupChatImage"
        chatImage+=getUserChatImageElement(otherChatUsers[1])
    }
    return `<div class='resultImageContainer ${groupChatClass}'>${chatImage}</div>`
}

function getUserChatImageElement(user){
    if(!user || !user.profilePic){
        return alert("User passed into f() is invalid");
    }
    return `<img src='${user.profilePic}' alt='user's profile pic'></img>`
}