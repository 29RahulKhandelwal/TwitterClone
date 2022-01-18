$("#chatNameButton").click(()=>{
    var name=$("#chatNameTextbox").val().trim();
    $.ajax({
        url:"/api/chat/"+chatId,
        type:"PUT",
        data:{chatName:name},
        success:(data,status,xhr)=>{
            if(xhr.status!=204){
                alert("could not update");
            }else{
                location.reload();
            }
        }
    })
})