var dbUtil =  require('./dbUtil.js');
var obj = {
    "selector": {
     "_id": "finalList"
      }
   };
var obj2 = {
    "selector": {
     "_id": "device-map"
      }
   };
var obj_bind_list = {
    "selector": {
     "category": "device"
      }
   };

var deviceobj = {
    "selector": {
      "macAddr": "0000000004000493",
      "recv": {
              "$gte": "2017-09-23T10:00",
              "$lt": "2017-09-24T12:00"
          }
    },
    "fields": [
      "date",
      "recv",
      "information"
    ],
    "sort": [
      {
        "_id": "asc"
      }
    ],
    "skip": 0
  }

function findFinalList(callback){
    dbUtil.queryDoc(obj).then(function(value) {
        var finalList = [];
        if(value.docs.length > 0){
            finalList = value.docs[0];
        }
        return callback(null,finalList);
      }, function(reason) {
        return callback(reason);
      });
}

function findDeviceList(obj, callback){
    if(obj.macAddr && obj.macAddr.length === 8){
      deviceobj.selector.macAddr = '00000000' + obj.macAddr;
    }else{
      deviceobj.selector.macAddr = obj.macAddr;
    }
    deviceobj.selector.recv.$gte = obj.from;
    deviceobj.selector.recv.$lt = obj.to;
    console.log("Query JSON :\n" +JSON.stringify(deviceobj));
    dbUtil.queryDoc(deviceobj).then(function(value) {
        var deviceList = [];
        if(value.docs.length > 0){
            deviceList = value.docs;
        }
        return callback(null,deviceList);
      }, function(reason) {
        return callback(reason);
      });
}

function findBindDevice(callback){
    dbUtil.queryDoc(obj_bind_list).then(function(value) {
        var bindList = [];
        if(value.docs.length > 0){
            bindList = value.docs;
        }
        return callback(null,bindList);
      }, function(reason) {
        return callback(reason);
      });
}

module.exports = {
    findFinalList,
    findDeviceList,
    findBindDevice
  }