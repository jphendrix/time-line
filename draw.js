//TODO: Allow this to be user editable
function getColor(titles){
	var colors = {
		'founding father':'orange'
		,'president':'red'
		,'vice president':'blue'
		,'scientist':'brown'
		,'revolutionary war':'red'
		,'civil war': 'red'
		,'wwi': 'red'
		,'wwii': 'red'
		,'cold war': 'gray'
		,'apollo program': 'blue'
	}
	
	for(var i=0; i<titles.split(',').length; i++){
		if(colors[titles.split(',')[i].toLowerCase()]){
			return colors[titles.split(',')[i].toLowerCase()];
		}
	}
	return 'black';
}


var lines = [];
var ctx;

$(function(){
  //TODO: re-size messes up the x/y offset
	//Set the canvas to the window size
  //$("#C").width($( window ).width()-10);
  //$( window ).resize(function() {
  //  $("#C").width($( window ).width()-10);
  //  draw(filtered.person.length===0?data:filtered);
  //});

	//Setup on change handlers for filters
	$("select[name=person]").change(function(){draw(filterData())});
	$("select[name=event]").change(function(){draw(filterData())});
	
	//Get canvas drawing context
	ctx = $("#C")[0].getContext("2d");
	
	//Read data from Google Doc
	//readData("https://spreadsheets.google.com/feeds/list/1p7N271XNTghpJhdP7qXsFaBZcFNRuG-npiUZK-1ZTAY/od6/public/values?alt=json");
});

function filterData(){
	var person = $("select[name=person]").val().map(function(x){return x.toUpperCase()});
	var event = $("select[name=event]").val().map(function(x){return x.toUpperCase()});
	
	return data.filter({person:person,event:event});
}

//TODO: refactor as intersect function to allow re-use for mouse over context
function getRowAssignment(who,start,end){
	var found_row = true;
	for(var i=0; i<lines.length; i++){
		var collided_with = 'no boby';
		found_row = true;
		for(j=0; j<lines[i].blocks.length; j++){
			
			if(start >= lines[i].blocks[j].start && start <= lines[i].blocks[j].end){
				found_row = false;
				break;
			}
			if(end >= lines[i].blocks[j].start && end <= lines[i].blocks[j].end){
				found_row = false;
				break;
			}
			
			if(lines[i].blocks[j].start >= start &&  lines[i].blocks[j].start <= end){
				found_row = false;
				break;
			}
			
			if(lines[i].blocks[j].end >= start &&  lines[i].blocks[j].end <= end){
				found_row = false;
				break;
			}
		}
		
		if(found_row){
			lines[i].blocks.push({who:who,start:start,end:end});
			return i;
		}
	}
	
	lines.push({row:lines.length, blocks:[{who:who,start:start,end:end}]});
	return lines.length-1;
}	

//Keep track of what is actually on the screen (for mouse events)
var drawnItems = {
  find: function(x,y){
    var items = [];
    for(var key in this.items){
      if( (this.items[key].x <= x && x <= this.items[key].x+this.items[key].w) && (this.items[key].y <= y && y<= this.items[key].y+this.items[key].h)){
        items.push(this.items[key]);
      }
        
    }
    
    return items;
  },
  items:{}
}; 
function draw(d){
	ctx.clearRect(0, 0, $("#C").width()*2, $("#C").height()*2);
	lines = [];
	drawnItems.items = {};
	var xOffset = 0;
	var xScale = 0;
	
	xOffset = d.minDate*-1;
	yOffset = 50;
	xScale = ((d.maxDate+xOffset)-(d.minDate + xOffset))/1400;

	for(let i=0; i<d.event.length; i++){
		if(!d.event[i].name){continue;}
		var x = d.event[i].start;
		var y = d.event[i].end;
		
		x = (x+xOffset)/xScale;
		y = (y+xOffset)/xScale;
		w = (y) - x;
		ctx.beginPath();
		ctx.globalAlpha=1;
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'black';
		ctx.textAlign = 'left';
		ctx.fillText(d.event[i].title,x+5,10);
		ctx.lineWidth=0.5;
		ctx.rect(x,0,w,$("#C").height());
		
		ctx.beginPath();
		ctx.fillStyle = getColor(d.event[i].title)
		ctx.strokeStyle = getColor(d.event[i].title)
		ctx.globalAlpha=0.2;
		ctx.fillRect(x,0,w,$("#C").height());
		ctx.stroke();
		
		drawnItems.items['e'+i] = {type:'event', name:d.event[i].name, x:x, y:0,w:w,h:$("#C").height()};
	}
	
	for(let i=0; i<d.person.length; i++){
		if(!d.person[i].name){continue;}
		var foo = d.person[i].name;
		var x1 = d.person[i].start;
		var x2 = d.person[i].end;
		
		x1 = (x1+xOffset)/xScale;
		x2 = (x2+xOffset)/xScale;
		w = (x2) - x1;
		
		var row = getRowAssignment(d.person[i].name,x1,x1+w);
		
		ctx.beginPath();
		ctx.globalAlpha=1;
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'black';
		ctx.lineWidth=1;
		ctx.rect(x1,yOffset+(row*50),w,45);
		ctx.fillText(d.person[i].name,x1+5,yOffset+(row*50)+10);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.fillStyle = getColor(d.person[i].title)
		ctx.strokeStyle = getColor(d.person[i].title)
		ctx.globalAlpha=0.2;
		ctx.fillRect(x1,yOffset+(row*50),w,45);
		
		drawnItems.items['p'+i] = {type:'person', name:d.person[i].name, x:x1, y:yOffset+(row*50),w:w,h:45};
		
		var timeline = d.person[i].timeline;
		for(var j=0; j<timeline.length; j++){
			var tx = timeline[j].start;
			var ty = timeline[j].end;
			
			tx = (tx+xOffset)/xScale;
			ty = (ty+xOffset)/xScale;
			
			ctx.beginPath();
			ctx.globalAlpha=1;
			ctx.moveTo(tx,yOffset+(row*50)+((j+5)*3));
			ctx.lineTo(ty,yOffset+(row*50)+((j+5)*3));
			ctx.lineWidth=2;
			ctx.strokeStyle = getColor(timeline[j].title)
			ctx.stroke();
		}
	}
}