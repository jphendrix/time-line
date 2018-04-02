//TODO: Hold the shape & offset info
var data = {
	person:[]
	,event:[]
	,minDate:Number.MAX_SAFE_INTEGER
	,maxDate:Number.MIN_SAFE_INTEGER
	,filter: function(args){
		var filtered = {
			person:[] 
			,event:[]
			,minDate:Number.MAX_SAFE_INTEGER
			,maxDate:Number.MIN_SAFE_INTEGER	
		};
		var addedItems = [];
		
		//Key will be either "person" or "event"
		for(var key in args){
			for(var i=0; i<this[key].length; i++){

				//Skip this one if already included
				if( $.inArray(this[key][i].name,addedItems) >=0 ){  continue;}

				//Apply this filter to any title associateed with this entry
				var titles = this[key][i].title.split(',').map(function(x){return x.toUpperCase()})

				for(var j=0; j<titles.length; j++){
					if($.inArray(titles[j],args[key])>=0){
						var start = (new Date(this[key][i].start))*1;
						var end = (new Date(this[key][i].end))*1;

						if(start<filtered.minDate){filtered.minDate = start; }
						if(end>filtered.maxDate){filtered.maxDate = end;}
						filtered[key].push( JSON.parse(JSON.stringify(this[key][i])) );
						addedItems.push(this[key][i].name);
						break;
					}
				}
			}
		}
		
		return filtered;
	}
	,find: function(args){
		for(var i=0; i<this[args.type].length; i++){
			if(this[args.type][i].name == args.name){
				return {success:true, result:this[args.type][i]};
			}
		}
		return {success:false, result:{}};
	}
};
	
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
	//Set the canvas to the window size
	$("#C").width($( window ).width()-10);
	$( window ).resize(function() {
		$("#C").width($( window ).width()-10);
		draw(filtered.person.length===0?data:filtered);
	});
	
	//Setup on change handlers for filters
	$("select[name=person]").change(function(){draw(filterData())});
	$("select[name=event]").change(function(){draw(filterData())});
	
	//Get canvas drawing context
	ctx = $("#C")[0].getContext("2d");
	
	//Read data from Google Doc
	readData("https://spreadsheets.google.com/feeds/list/1p7N271XNTghpJhdP7qXsFaBZcFNRuG-npiUZK-1ZTAY/od6/public/values?alt=json");
});

function readData(source){
  $.getJSON(source, function (jdata) {
		/*
		It is possible for a sub timeline to be in the file before the parent event/person.
		If this happens, hold onto the sub timeline and try to process it after all
		of the other events/people have been loaded.
		*/
		var orphaned_things = [];
		
		/*
		Push all of the events/people to the container object
		*/
		function addItem(item, allow_orphans){
			switch(item.type){
				default: break;
				case "event":
				case "person":
					data[item.type].push(item); 

					var start = item.start
					var end = item.end

					if(start<data.minDate){data.minDate = start; }
					if(end>data.maxDate){data.maxDate = end;}
					
					//Build title filter
					var titles = item.title.split(',');
					for(var i=0; i<titles.length; i++){
						var optionExists = ($("select[name="+item.type+"] option[value='" + titles[i].toUpperCase() + "']").length > 0);
						if(!optionExists)
						{
							$("select[name="+item.type+"]").append("<option value='"+titles[i].toUpperCase()+"'>"+titles[i]+"</option>");
						}
					}
					break;
				case "event_timeline":
				case "person_timeline":
					//This is a sub timeline and needs a parent to be attached to.
					var type = item.type.split('_')[0]; //Get the type before the underscore.  Either "event" or "person".
					var e = data.find({type:type, name:item.name})
					if(e.success === true){
						e.result.timeline.push(item); //We have a parent thing
					}else{
						if(allow_orphans){orphaned_things.push(item);} //This sub timeline is orphaned but we might have it later.  Will re-try.
					}
					break;
			}
		}
		
		//TODO: Add a check to make sure the columns we expect are actualy present.
		for(var i=0; i<jdata.feed.entry.length; i++){
			var item = {
				type:jdata.feed.entry[i].gsx$type.$t
				,name:jdata.feed.entry[i].gsx$name.$t
				,title:jdata.feed.entry[i].gsx$title.$t
				,start:   (new Date(jdata.feed.entry[i].gsx$start.$t))*1    
				,end:jdata.feed.entry[i].gsx$end.$t === ""?(new Date())*1:(new Date(jdata.feed.entry[i].gsx$end.$t))*1
				,timeline:[]
			}
			
			addItem(item,true);
		}
		
		for(var j=0; j<orphaned_things.length; j++){
			addItem(orphaned_things[j],false);
		}
		
		//For now this has to be here b/c of the async
		draw(data);
  });
}

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

var drawnItems = {}; //Keep track of what is actually on the screen (for mouse events)
function draw(d){
	ctx.clearRect(0, 0, $("#C").width()*2, $("#C").height()*2);
	lines = [];
	drawnItems = {};
	var xOffset = 0;
	var xScale = 0;
	
	xOffset = d.minDate*-1;
	yOffset = 50;
	xScale = ((d.maxDate+xOffset)-(d.minDate + xOffset))/1400;

	for(var i=0; i<d.event.length; i++){
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
		
		drawnItems['e'+i] = {type:'event', name:d.event[i].name, x:x, y:0,w:w,h:$("#C").height()};
	}
	
	for(var i=0; i<d.person.length; i++){
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
		
		drawnItems['p'+i] = {type:'person', name:d.person[i].name, x:x1, y:yOffset+(row*50),w:w,h:45};
		
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