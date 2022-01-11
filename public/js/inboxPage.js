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
    var chatName="Chat name";
    var image="";
    var latestMessage="This is the latest message"
    return `<a class='resultListItem' href='/messages/${chatData._id}'>
                <div class=''resultsDetailsContainer>
                    <span class="heading">${chatName}</span>
                    <span class="subText">${latestMessage}</span>
                </div>
            </a>`
}