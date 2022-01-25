$(document).ready(()=>{
    $.get("/api/notifications",(data)=>{
        outputNotificationList(data,$(".resultsContainer"));
    })
})

$("#markNotificationAsRead").click(()=>markNotificationAsOpened());

function outputNotificationList(notifications,container){
    notifications.forEach(notification=>{
        var html=createNotificationHtml(notification);
        container.append(html)
    })
    if(notifications.length==0){
        container.append("<span class='noResults'>Nothing to show.</span>")
    }
}

function createNotificationHtml(notification){
    var userFrom=notification.userFrom;
    var text=getNotificationText(notification);
    var href=getNotificationUrl(notification);
    var className=notification.opened ? "" : "active";
    return `<a href="${href}" class="resultListItem notification ${className}" data-id="${notification._id}">
                <div class="resultsImageContainer">
                    <img src="${userFrom.profilePic}"></img>
                </div>
                <div class="resultsDetailsContainer ellipsis">
                    <span class="ellipsis">${text}</span>
                </div>
            </a>`
}

function getNotificationText(notification){
    var userFrom=notification.userFrom;
    if(!userFrom.firstname || !userFrom.lastname){
        return alert("user from data not pupulated");
    }
    var userFromName=`${userFrom.firstname} ${userFrom.lastname}`
    var text;
    if(notification.notificationType=="retweet"){
        text=`${userFromName} retweeted one of your post`;
    }else if(notification.notificationType=="postLike"){
        text=`${userFromName} liked one of your post`;
    }else if(notification.notificationType=="reply"){
        text=`${userFromName} reply to one of your post`;
    }else if(notification.notificationType=="follow"){
        text=`${userFromName} followed you`;
    }
    return `<span class="ellipsis">${text}</span>`
}

function getNotificationUrl(notification){
    var url="#";
    if(notification.notificationType=="retweet" || notification.notificationType=="postLike" || notification.notificationType=="reply"){
        url=`/posts/${notification.entityId}`;
    }else if(notification.notificationType=="follow"){
        url=`/profile/${notification.entityId}`;
    }
    return url;
}