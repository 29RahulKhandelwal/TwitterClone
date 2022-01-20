$(document).ready(()=>{
    $.get(`/api/chats/${chatId}`,(data) => $("#chatName").text(getChatName(data)))
    $.get(`/api/chats/${chatId}/messages`,(data)=>{
        var messages=[];
        data.forEach((message)=>{
            var html=createMessageHtml(message);
            messages.push(html);
        })
        var messagesHtml=messages.join("");
        addMessagesHtmlToPage(messagesHtml)
    })
})

function addMessagesHtmlToPage(html){
    $(".chatMessages").append(html);
}

$("#chatNameButton").click(()=>{
    var name=$("#chatNameTextbox").val().trim();
    $.ajax({
        url:"/api/chats/" + chatId,
        type:"PUT",
        data:{chatName:name},
        success:()=>{
            location.reload();
        }
    })
})
$(".sendMessageButton").click(()=>{
    messageSubmitted()
})
$(".inputTextbox").keydown((event)=>{
    if(event.which===13){
        messageSubmitted()
        return false
    }
})

function messageSubmitted(){
    var content=$(".inputTextbox").val().trim();
    if(content!=""){
        sendMessage(content);
        $(".inputTextbox").val("");
    }
}

function sendMessage(content){
    $.post("/api/messages",{content:content,chatId:chatId},(data,status,xhr)=>{
        if(xhr.status!=201){
            alert("could not send message")
            $(".inputTextbox").val(content);
            return;
        }
        addChatMessageHtml(data);
    })
}

function addChatMessageHtml(message){
    if(!message || !message._id){
        alert("Message is not valid");
        return;
    }
    var messageDiv=createMessageHtml(message)
    addMessagesHtmlToPage(messageDiv);
}

function createMessageHtml(message){
    var isMine = message.sender._id == userLoggedIn._id;
    var liClassName = isMine ? "mine" : "theirs";

    return `<li class='message ${liClassName}'>
                <div class='messageContainer'>
                    <span class='messageBody'>
                        ${message.content}
                    </span>
                </div>
            </li>`;
}