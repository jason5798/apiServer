var express = require('express');
var moment = require('moment-timezone');
var dbUtil =  require('../models/dbUtil.js');
var dbHelper =  require('../models/dbHelper.js');
var listPath = './public/data/finalList.json';
var hour = 60*60*1000;
var JsonFileTools =  require('../models/jsonFileTools.js');
var settings = require('../settings');
var router = express.Router();
var serverUri = "http:\/\/" +settings.host + ":" 
						+ settings.port + "\/todos\/";
var debug = true;
var tmpDevices = {};

router.route('/devices')
	.get(function(req, res) {
		var mac = req.query.mac;
		if(mac === null || mac === undefined || mac === ''){
			return res.json({});;
		}
		var from = req.query.from;
		var to = req.query.to;
		var sort = req.query.sort;
		
		if(sort){
			var arrayOfStrings = splitString(sort,'|');
		}
		var page = req.query.page;
		var per_page = req.query.per_page;
		
		var json = getQueryJSON(mac,from,to);
		var json2 = {"page": page, "per_page": per_page};
		console.log('page information : ' + JSON.stringify(json2));
		if(tmpDevices.mac && page > 1 || arrayOfStrings[0] !== 'date'){
			var tableData = getTableData(tmpDevices[mac], json2, arrayOfStrings);
			return res.json(tableData);
		}else{
			dbHelper.findDeviceList(json,function(err,lists){
				if(err){
					return res.json({});
				}
				tmpDevices[mac] = lists;
				var tableData = getTableData(lists, json2, arrayOfStrings);
				return res.json(tableData);
			});
		}
	});

router.route('/devices/:mac')

	// get the bear with that id
	.get(function(req, res) {
		var mac    = req.query.mac;
		var option = req.query.option;
		var mdate  = req.query.mdate;
		var obj = {
			"selector": {
			 "macAddr": mac
			},
			 "fields" : ["macAddr", "date", "information."],
			 //"limit": 10,
			 "skip": 0
		   };
		if(mac){
			dbUtil.queryDoc(obj).then(function(value) {
				// on fulfillment(已實現時)
				var devices = value.docs;
				return res.json(devices);
			  }, function(reason) {
				// on rejection(已拒絕時)
				return res.send({});
			  })
		}else{
			return res.json({});
		}
	})

	// update the bear with this id
	.put(function(req, res) {
		/*Bear.findById(req.params.bear_id, function(err, bear) {

			if (err)
				res.send(err);

			bear.name = req.body.name;
			bear.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Bear updated!' });
			});

		});*/
	})

	// delete the bear with this id
	.delete(function(req, res) {
		/*Bear.remove({
			_id: req.params.bear_id
		}, function(err, bear) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});*/
	});

router.route('/datas')
	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var mac = req.query.mac;
		if(debug === false && (mac === null || mac === undefined || mac === '') ){
			return res.json({});;
		}
		var from = req.query.from;
		var to = req.query.to;
		var json = getQueryJSON(mac,from,to);
		var newdata = {},time = [], mPh = [], mDo = [];
		var mCond = [],mTemp = [],mNtu = [], mVol = [];
		var arr = [];
		var csv = req.query.csv;
		if(tmpDevices[mac] && csv){
			var tableData = tmpDevices[mac];
			//var data = csvData(tableData);
			return res.json(tableData);
		} else {
			dbHelper.findDeviceList(json,function(err,lists){
				if(err || lists.length === 0){
					return res.json({});
				}
	
				var keys = Object.keys(lists[0].information);
				for(var k = i=0; k<keys.length; k++){
					arr[k] = [];
				}
				var devices = lists.sort(dynamicSort('-date'));
				
				for (var i in devices){
					if(devices[i].information){
						time.push(devices[i].date);
						
						for(var j=0; j<keys.length ; j++){
							//console.log('device : ' + devices[i]['information']);
							//console.log('key : ' + keys[j] + ' => value : ' + devices[i]['information'][keys[j]]);
							arr[j].push(devices[i]['information'][keys[j]]);
						}
						//console.log('('+ i + ')' +devices[i].recv + ' => ' + JSON.stringify(devices[i].info));
					}						
				}
				//console.log('time: ' + time.length);
				newdata.time = time;
				
				for(var k = i=0; k<keys.length; k++){
					newdata[keys[k]] = arr[k];
				}
				
				return res.json(newdata);	
			})
		}
		
	});

router.route('/lists')

	.get(function(req, res) {
		var name    = req.query.name;
		//JsonFileTools.saveJsonToFile(listPath,json);
		dbHelper.findFinalList(function(err,list){
			if(err){
				return res.json({});
			}
			return res.json(list);
		})
	});

router.route('/bindlist')

	.get(function(req, res) {

		dbHelper.findBindDevice(function(err,lists){
			if(err){
				return res.json({});
			}
			
			return res.json(lists);
		})
	});

router.route('/deviceMaps')

	.get(function(req, res) {
      
		dbHelper.findDeviceMaps(function(err,lists){
			if(err || lists.length === 0){
				return res.json({});
			}
			
			return res.json(lists[0]);
		})
	});


router.route('/profile')
    //New profile
	.post(function(req, res) {
        var profile = req.body.profile;
		dbHelper.addProfile(profile, function(result){
			console.log('result : ' + result);
			return res.json({result:result});
		})		
	})

    //Find profile list
	.get(function(req, res) {
		  dbHelper.findProfileList(function(err,lists){
			  if(err || lists.length === 0){
				  return res.json([]);
			  }
			  
			  return res.json(lists);
		  })
	  })
	
	//Update profile
	.put(function(req, res) {
        var profile = req.body.profile;
		dbHelper.updateProfile(profile, function(result){
			console.log('result : ' + result);
			return res.json({result:result});
		})		
	})

    //Delete profile
	.delete(function(req, res) {
		var name = req.body.name;
	    if(name === null || name === undefined || name === ''){
			console.log('Delete profile name is empty !!!');
			return res.json({result:null}); 
		}
		dbHelper.delProfile(name, function(result){
			console.log('result : ' + result);
			return res.json({result:result});
		})
	  })


module.exports = router;

function getQueryJSON(mac,from,to){
	if(mac === null || mac === undefined || mac === ''){
		mac = "000000000501070b";
	}
	var time =  getCurrentTimestamp();
	//var now =  new Date(time);
	var now = moment.unix(time/1000);
	if(to === null || to === undefined || to === ''){
		to = now.format("YYYY-MM-DD HH:mm");
	}else{

	}
	if(from === null || from === undefined || from === ''){
		//from = now.subtract(1, 'days');
		from = now.format('YYYY-MM-DD 00:00');
	}
	
	console.log('quer from : '+ from + ' => to : ' + to);
	return {"macAddr":mac, "from": from, "to": to};
}

//ASC 代表結果會以由小往大的順序列出，而 DESC 代表結果會以由大往小的順序列
function getTableData(lists,obj,sort){
	var json = {};
	json.total = lists.length;
	json.per_page = Number(obj.per_page);
	json.current_page = Number(obj.page);
	json.last_page = Math.ceil(json.total/json.per_page);
	var property = '';
	if(sort){
		if(sort[1] === 'desc'){
			property = '-' + sort[0];
		}else{
			property =  sort[0];
		}
	}
	var mList = lists.sort(dynamicSort(property));
	if(json.current_page === 1 || json.last_page === 1){
		json.prev_page_url = null;
	}else {
		json.prev_page_url = serverUri+"devices?per_page="+json.per_page+"&page="+(json.current_page-1);
	}

	if(json.last_page === 1 || json.current_page === json.last_page){
		json.next_page_url = null;
	}else {
		json.next_page_url = serverUri+"devices?per_page="+json.per_page+"&page="+(json.current_page+1);
	}
	
	json.from = ((json.current_page -1 )*json.per_page)+1;
	json.to = json.current_page*json.per_page;
	if(json.to > json.total){
		json.to = json.total;
	}
	var newLists = [];
	for(var i = (json.from-1); i < json.to ; i++){
		newLists.push(lists[i]);
	}
	json.data = newLists;
	return json;
}

/*function dynamicSort(property) {
    var sortOrder = 1;
    if(property[1] === "desc") {
        sortOrder = -1;
        property = property[0];
    }
    return function (a,b) {
		var aResult,bResult;
		if( property.includes("date")){
			aResult = new Date(a[property]);
			bResult = new Date(b[property]);
			console.log('a : '+ aResult);
			console.log('b : '+ bResult);
			var result = (aResult.getTime() < bResult.getTime()) ? -1 : (aResult.getTime() > bResult.getTime()) ? 1 : 0;
            return result * sortOrder;
		}else{
			//console.log('a : '+ a[property]);
			//console.log('b : '+ b[property]);
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
		    return result * sortOrder;
		}
    }
}*/
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function splitString(stringToSplit, separator) {
	var arrayOfStrings = stringToSplit.split(separator);
  
	//console.log('The original string is: "' + stringToSplit + '"');
	//console.log('The separator is: "' + separator + '"');
	//console.log('The array has ' + arrayOfStrings.length + ' elements: ' + arrayOfStrings.join(' / '));
	return arrayOfStrings;
}

function csvData(objArray){
	var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
	var str = ''
	var line = ''
	var keys = Object.keys(array[0])
	var target = ['項目','日期','資料','溫度','水含量','酸鹼值','電導度'];
	//For title
	for (var index in target) {
		if (line !== '') line += ',';
		line += target[index];
	  }
	str += line + '\r\n'
	 
	for (var i = 0; i < keys.length; i++) {
	  var line = (i+1);

	  for (var index in array[i]) {
		if (line !== '') line += ','
		if (typeof array[i][index] === 'object') {
		  line += getObjectStr(array[i][index])
		} else {
		  line += array[i][index]
		}
	  }
	  str += line + '\r\n'
	}
	return str
}

function getObjectStr(obj) {
	var keys = Object.keys(obj);
	var str = '';
	for(var index in keys){
		if (str !== '') str += ',';
		str += keys[index]
	}
	return str;
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
  
//For save notify in edit notify
function changeNotify(max,min,maxInfo,minInfo,info){
	var keys = Object.keys(info.fieldName);
	var isNoSetting = true;

	if(info.notify === undefined){
		info.notify = {};
	}

	for(var i = 0;i<max.length;i++){

		if(info.notify[keys[i]] === undefined){
			info.notify[keys[i]] = {};
		}
		if(max[i] != '' ){
			isNoSetting =false;
			info.notify[keys[i]]['max'] = max[i];
			if(maxInfo[i] != '' ){
				info.notify[keys[i]]['maxInfo'] = maxInfo[i];
			}else {
				info.notify[keys[i]]['maxInfo'] = info.fieldName[keys[i]]+'超過最大值';
			}
		}else {
			if(info.notify[keys[i]]['max'] !== undefined){
				delete info.notify[keys[i]]['max'];
			}
			if(info.notify[keys[i]]['maxInfo'] !== undefined){
				delete info.notify[keys[i]]['maxInfo'];
			}

		}
		if(min[i] != '' ){
			isNoSetting = false;
			info.notify[keys[i]]['min'] = min[i];
			if(minInfo[i] != '' ){
				info.notify[keys[i]]['minInfo'] = minInfo[i];
			}else {
				info.notify[keys[i]]['minInfo'] = info.fieldName[keys[i]]+'低於最小值';
			}
		}else {
			if(info.notify[keys[i]]['min'] !== undefined){
				delete info.notify[keys[i]]['min'];
			}
			if(info.notify[keys[i]]['minInfo'] !== undefined){
				delete info.notify[keys[i]]['minInfo'];
			}
		}
		/*if(flag === false){//No setting then remove setting json
			delete info.notify[keys[i]];
		}*/
	}
	var keys2 = Object.keys(info.notify);
	if(isNoSetting){
		delete info.notify;
	}
	return info;
}