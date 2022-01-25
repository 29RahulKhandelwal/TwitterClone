$(document).ready(()=>{
    $.get("/api/notifications",(data)=>{
        outputNotificationList(data,$(".resultsContainer"));
    })
})

$("#markNotificationAsRead").click(()=>markNotificationAsOpened());