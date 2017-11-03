var moment = require('moment-timezone');
var dbHelper =  require('./dbHelper.js');
var dbUtil =  require('./dbUtil.js');
updateData();

function updateData () {
	var json = {
		"selector": {
		   "macAddr": "00000000050102c9"
		},
		"sort": [
		   {
			  "_id": "asc"
		   }
		]
	 }
	 
	 dbUtil.queryDoc(json).then(function(value) {
        var lists = [];
        if(value.docs.length > 0){
            lists = value.docs;
        }
	
		for (var i in lists) {
			let device = lists[i]; 
			if(device.information === undefined) {
				continue;
			}
			try {
				var temp = device.information.temprature;
			} catch(err) {
				console.log(err);
				continue;
			}
			if(device.information.typeName !== undefined || device.information.fieldName !== undefined || temp !== undefined) {
				if(temp) {
					device.information.temperature = device.information.temprature;
					delete device.information.temprature;
					console.log('device id : ' + device._id);
					
				}
				if(device.information.typeName){
					delete device.information.typeName;
				}
				if(device.information.fieldName){
					delete device.information.fieldName;
				}
				dbUtil.insert(device).then(function(value) {
					// on fulfillment(已實現時)
					 console.log("#### Update device success :"+ JSON.stringify(value));
				  }, function(reason) {
					// on rejection(已拒絕時)
					console.log("???? Update device fail :" + reason);
				  });
			}
		}
	});
}

function getCurrentTimestamp() {
	var d = new Date();
	var d_ts = d.getTime(); //Date.parse('2017-09-12 00:00:00'); //get time stamp
	var d_offset = d.getTimezoneOffset();
	var d_tz = d_offset/(-60); //get time zone of system
	var my_tz = 8; //input time zone of user
	console.log("showSize :"+ d);
	console.log("showPos d_ts : " + d_ts);
	console.log("setLeft d_tz : " + d_tz);
	var time = d_ts-(d_tz-my_tz)*3600000;
	console.log("setW : " + time); //convert function
	return time;
  }

  function convertTime(dateStr)
  {
	  //method 1 - use convert function
	  //var d = new Date();
	  var d = new Date(dateStr);
	  var d_ts = d.getTime(); //Date.parse('2017-09-12 00:00:00'); //get time stamp
	  var d_offset = d.getTimezoneOffset();
	  var d_tz = d_offset/(-60); //get time zone of system
	  var my_tz = 8; //input time zone of user
	  console.log("showSize :"+ d);
	  console.log("showPos d_ts : " + d_ts);
	  console.log("setLeft d_tz : " + d_tz);
	  var time = d_ts-(my_tz-d_tz)*3600000;
	  console.log("setW : " + time); //convert function
	  return time;
  }
  
  function getDateString(a){
	  var year = a.getFullYear();
	  var month = a.getMonth()+1;
	  var date = a.getDate();
	  var hour = a.getHours();
	  var min = a.getMinutes();
	  var sec = a.getSeconds();
	  var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec ;
	  return time;
	}