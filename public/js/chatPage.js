$(document).ready(()=>{
    $.get(`/api/chats/${chatId}`,(data) => $("#chatName").text(getChatName(data)))
})
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
        console.log(data);
    })
}