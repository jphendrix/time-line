function showDetail(target){
  let $d = $("div.info").html('');
  
  for(var i=0; i<target.length; i++){
    
  }
  $d.append("<>")
}

$(function(){
  $("#C").mousemove(function(e){
    //console.log("moved to:" + (e.pageX-$("#C")[0].offsetLeft) + "," + (e.pageY-$("#C")[0].offsetTop))
    //$("#C").click(function(e){console.log("clicked at:" + e.pageX + "," + e.pageY)});
    var items = drawnItems.find((e.pageX-$("#C")[0].offsetLeft), (e.pageY-$("#C")[0].offsetTop));
    if(items.length>0){
      console.log(items);  
    }
  });
});