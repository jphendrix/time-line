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
		
    function sortByStartDate(a, b) {
      return ((a.start < b.start) ? -1 : ((a.start > b.start) ? 1 : 0));
    }
    filtered.person.sort(sortByStartDate);
    
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

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

 https://docs.google.com/spreadsheets/d/1p7N271XNTghpJhdP7qXsFaBZcFNRuG-npiUZK-1ZTAY/edit#gid=0
 https://docs.google.com/spreadsheets/d/1p7N271XNTghpJhdP7qXsFaBZcFNRuG-npiUZK-1ZTAY/edit?usp=sharing
 */
function readData() {

  /*
  It is possible for a sub timeline to be in the file before the parent event/person.
  If this happens, hold onto the sub timeline and try to process it after all
  of the other events/people have been loaded.
  */
  var orphaned_things = [];

  /*
  Push all of the events/people to the container object
  */
  function addItem(item, allow_orphans) {
    switch (item.type) {
      default: break;
      case "event":
          case "person":
          data[item.type].push(item);

        var start = item.start
        var end = item.end

        if (start < data.minDate) {
          data.minDate = start;
        }
        if (end > data.maxDate) {
          data.maxDate = end;
        }

        //Build title filter
        var titles = item.title.split(',');
        for (var i = 0; i < titles.length; i++) {
          var optionExists = ($("select[name=" + item.type + "] option[value='" + titles[i].toUpperCase() + "']").length > 0);
          if (!optionExists) {
            $("select[name=" + item.type + "]").append("<option value='" + titles[i].toUpperCase() + "'>" + titles[i] + "</option>");
          }
        }
        break;
      case "event_timeline":
          case "person_timeline":
          //This is a sub timeline and needs a parent to be attached to.
          var type = item.type.split('_')[0]; //Get the type before the underscore.  Either "event" or "person".
        var e = data.find({
          type: type,
          name: item.name
        })
        if (e.success === true) {
          e.result.timeline.push(item); //We have a parent thing
        } else {
          if (allow_orphans) {
            orphaned_things.push(item);
          } //This sub timeline is orphaned but we might have it later.  Will re-try.
        }
        break;
    }
  }

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1p7N271XNTghpJhdP7qXsFaBZcFNRuG-npiUZK-1ZTAY',
    range: 'People!A2:E',
  }).then(function(response) {
    console.log(response);

    var range = response.result;
    if (range.values.length > 0) {
      for (i = 0; i < range.values.length; i++) {
        var row = range.values[i];

        //TODO: Add a check to make sure the columns we expect are actualy present.
        var item = {
          type: row[1],
          name: row[0],
          title: row[2],
          start: (new Date(row[3])) * 1,
          end: (row[4]||"") === "" ? (new Date()) * 1 : (new Date(row[4])) * 1,
          timeline: []
        }

        addItem(item, true);

        for (var j = 0; j < orphaned_things.length; j++) {
          addItem(orphaned_things[j], false);
        }

      }
      
      //For now this has to be here b/c of the async
      draw(data.filter({
        person: ['PRESIDENT'],
        event: ['WAR']
      }));

    } else {
      console.log('No data found.');
    }
  }, function(response) {
    console.log('Error: ' + response.result.error.message);
  });
}

function filterData() {
  var person = $("select[name=person]").val().map(function(x) {
    return x.toUpperCase()
  });
  var event = $("select[name=event]").val().map(function(x) {
    return x.toUpperCase()
  });

  return data.filter({
    person: person,
    event: event
  });
}