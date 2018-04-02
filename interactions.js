function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

$(function(){  
  $("#C").click(function(e){findTargets(this.relMouseCoords(e))});
});

function findTargets(args){
  targets = [];
  for(var key in drawnItems){
    var t = drawnItems[key];
    if(args.x > t.x && args.x < t.x+t.w){
      
      console.log("found:" + t.x + "," + (t.x+t.w) + "-" + JSON.stringify(t));
      targets.push( data.find({type:t.type, name:t.name}).result )
    }
  }
  console.log(targets);
  
  return targets;
}