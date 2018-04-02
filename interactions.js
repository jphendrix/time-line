$(function(){
  $("#C").mousemove(function(e){console.log("moved to:" + e.pageX + "," + e.pageY)});
  
  $("#C").click(function(e){console.log("clicked at:" + e.pageX + "," + e.pageY)});
});