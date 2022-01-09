var timer;
$("#searchBox").keydown((event)=>{
    clearTimeout(timer);
    var textbox=$(event.target);
    var value=textbox.val();
    var searchType=textbox.data().search;
    timer=setTimeout(()=>{
        value=textbox.val().trim();
        if(value==""){
            $(".resultsContainer").html("");
        }else{
            console.log(value)
        }
    },1000)
})