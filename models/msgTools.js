var debug = false;
var moment = require('moment-timezone');
var ParseDefine =  require('./parseDefine.js');
var JsonFileTools =  require('./jsonFileTools.js');
var dbUtil =  require('./dbUtil.js');
var settings =  require('../settings.js');
var mData,mMac,mRecv,mDate,mType,mExtra,mInfo,mTimestamp;
var obj;
var overtime = 24;
var hour = 60*60*1000;
//Save data to file path
var path = './public/data/finalList.json';
var mapPath = './public/data/parseMap.json';
//Save data
var finalList = {},deviceMap = {};
var finalListRev = '',deviceMapRev = '';
var count_map = {};//For filter repeater message key:mac+type value:tag
//Save user choice device type,GW MAC
var obj = {
    "selector": {
     "_id": "finalList"
      },
      "skip": 0
   };
var obj2 = {
    "selector": {
     "_id": "device-map"
      },
      "skip": 0
   };

function init(){
    updateFinalList();
    updateDeviceMap();
}

function updateFinalList(){
    dbUtil.queryDoc(obj).then(function(value) {
        // on fulfillment(已實現時)
        if(value.docs.length > 0){
            finalList = value.docs[0];
            finalListRev = finalList._rev;
        }
        //console.log("#### finalList : "+JSON.stringify(finalList));
      }, function(reason) {
        // on rejection(已拒絕時)
        console.log("#### updateFinalList fail  : "+JSON.stringify(reason));
      });
}

function updateDeviceMap(){
    dbUtil.queryDoc(obj2).then(function(value) {
        // on fulfillment(已實現時)
        if(value.docs.length > 0){
            deviceMap = value.docs[0];
            deviceMapRev = deviceMap._rev;
        }
        //console.log("#### finalList : "+JSON.stringify(finalList));
      }, function(reason) {
        // on rejection(已拒絕時)
        console.log("#### updateDeviceMap fail  : "+JSON.stringify(reason));
      });
}

init();

function convertTime(dateStr)
{
    //method 1 - use convert function
    //var d = new Date();
    var d = new Date(dateStr);
    var d_ts = d.getTime(); //Date.parse('2017-09-12 00:00:00'); //get time stamp
    console.log("showSize :"+ d);
    console.log("showPos d_ts : " + d_ts);
    return d_ts;
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

function parseMsg(obj) {
    console.log('MQTT message :\n'+JSON.stringify(obj));
    
    //Get data attributes
    mData = obj.data;
    mMac  = obj.macAddr;
    var timestamp = convertTime(obj.time);
    var tMoment = (moment.unix(timestamp/1000)).tz(settings.timezone);
    mRecv = obj.time;
    mDate = tMoment.format('YYYY-MM-DD HH:mm:ss');
    
    console.log('mRecv : '+  mRecv);
    console.log('mDate : '+ mDate);
    mExtra = {'gwip': obj.gwip, 
              'gwid': obj.gwid,
              'rssi': obj.rssi,
              'snr' : obj.snr,
              'fport': obj.fport,
              'frameCnt': obj.frameCnt,
              'channel': obj.channel};
    if(isSameCountCheck(mMac,obj.frameCnt) && debug === false){
        return null;
    }
   
    //Parse data
    if(mExtra.fport>0 ){
        mType = mExtra.fport.toString();
        var parseData = deviceMap[mType];
        mInfo = ParseDefine.getTypeData(mData,parseData);
    }

    var msg = {macAddr: mMac, data: mData, time: timestamp, recv: mRecv, date: mDate, extra: mExtra};
    finalList[mMac]=msg;
    
    if(mInfo){
        console.log('**** '+msg.date +' mac:'+msg.macAddr+' => data:'+msg.data+'\ninfo:'+JSON.stringify(mInfo));
        msg.information=mInfo;
    }
    if(settings.isSaveCloudant){
        dbUtil.insert(msg).then(function(value) {
            // on fulfillment(已實現時)
            console.log("#### Insert device data success :"+value);
        }, function(reason) {
            console.log("???? Insert device data fail :" + reason);
        }); 
    }
    
    return msg;
}

function setFinalList(list) {
    finalList = list;
}

function getFinalList() {
    return finalList;
}

function setDeviceMap(mapObj) {
    deviceMap = mapObj;
}

function setDeviceMapFromFile() {
    var obj = JsonFileTools.getJsonFromFile(mapPath);
    dbUtil.insert(obj,"device-map").then(function(value) {
        // on fulfillment(已實現時)
        console.log("#### Insert device-map success :"+ JSON.stringify(value));
      }, function(reason) {
        // on rejection(已拒絕時)
        console.log("???? Insert device-map fail :" + JSON.stringify(reason));
      });
}

function getDeviceMap() {
    return deviceMap;
}

function saveFinalListToFile(list) {
    //JsonFileTools.saveJsonToFile(path,finalList);
    if(list === null || list === undefined){
        list = finalList;
    }
    //For verify finalList is include _rev information
    var keys = Object.keys(list);
    if(keys.includes("_rev")){//FinalList is from DB include _rev and finalList key 
        keys.splice(0,2);
        if(keys.length === 0){
            return;
        }
        if(finalListRev){
            list._rev = finalListRev;
        }
        dbUtil.insert(list).then(function(value) {
            // on fulfillment(已實現時)
            console.log("#### Update finalList success :" + JSON.stringify(value));
            finalListRev = value._rev;
          }, function(reason) {
            // on rejection(已拒絕時)
            console.log("???? Update finalList fail :" + reason);
          });
    }else if(keys.length===0) { //No finalList
        console.log("???? No finalList data");
        return;
    }else {
        dbUtil.insert(list,'finalList').then(function(value) {
            // on fulfillment(已實現時)
            console.log("#### Update finalList success :"+ JSON.stringify(value));
            finalListRev = value._rev;
          }, function(reason) {
            // on rejection(已拒絕時)
            console.log("???? Update finalList fail :" + reason);
          });
    }
}

function getDevicesData(devices) {
    if(devices && devices.length > 0){
        var device = devices[0];
        var title = getTitle(device);
        var array = [];

        for (var i=0;i<devices.length;i++)
        {
            //if(i==53){
              //console.log( '#### '+devices[i].mac + ': ' + JSON.stringify(devices[i]) );
            //}
            array.push(getDevicesArray(devices[i],i));
        }
    }else{
        return null;
    }
    var data = {"aoColumns":title, "aaData":array};
    return data;
};

function getTitle(device){
    var title = [];
    title.push({"sTitle": "Date"});
    title.push({"sTitle": "Data"});
    var keys = Object.keys(device.information);
    for(var i = 0;i<keys.length;i++){
        title.push({"sTitle": capitalizeFirstLetter(keys[i])});
    }
    return title;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDevicesArray(obj,item){

    var arr = [];

    //arr.push(item);
    arr.push(obj.date);
    arr.push(obj.data);
    var keys = Object.keys(obj.information);
    for(var i = 0;i<keys.length;i++){
        arr.push(obj.information[keys[i]]);
    }

    return arr;
}

function getFinalData(finalist) {
    var mItem = 1;
    var array = [];
    if(finalist){

        //console.log( 'Last Device Information \n '+JSON.stringify( mObj));

        for (var mac in finalist)
        {
            //console.log( '#### '+mac + ': ' + JSON.stringify(finalist[mac]) );

            array.push(getArray(finalist[mac],mItem));
            mItem++;
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};

function getArray(obj,item){

    var arr = [];
    var connection_ok = "<img src='/icons/connection_ok.png' width='30' height='30' name='status'>";
    var connection_fail = "<img src='/icons/connection_fail.png' width='30' height='30' name='status'>";
    /*if(item<10){
        arr.push('0'+item);
    }else{
        arr.push(item.toString());
    }*/
    arr.push(item);

    arr.push(obj.mac);
    arr.push(obj.date);
    arr.push(obj.extra.rssi);
    arr.push(obj.extra.snr);
    console.log('obj.overtime :'+obj.overtime);


    if( obj.overtime){
        arr.push(connection_fail);
        //console.log('overtime = true');
    }else{
        arr.push(connection_ok);
        //console.log('overtime = false');
    }
    //console.log('arr = '+JSON.stringify(arr));
    return arr;
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

//count_map is local JSON object
function isSameCountCheck(mac,count){
	
	var tag = count_map[mac];

	if(tag === undefined){
		tag = -1;
	}

	if (tag === count){
		console.log('count:' + count + '(mac:' +mac + '):tag='+tag+'is same #### drop');
		return true;
	}else{
		count_map[mac] = count;
		console.log('count:' + count + '(mac:' +mac + '):tag='+tag +' @@@@ save' );
		return false;
	}
}

module.exports = {
    getFinalData,
    getDevicesData,
    saveFinalListToFile,
    setFinalList,
    getFinalList,
    parseMsg,
    updateDeviceMap,
    updateFinalList,
    setDeviceMap,
    setDeviceMapFromFile,
    getDeviceMap
  }

