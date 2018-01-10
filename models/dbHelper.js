var dbUtil =  require('./dbUtil.js');
var obj = {
    "selector": {
     "_id": "finalList"
      }
   };
//For device type name,field name and field parse map
var mapObj = {
    "selector": {
     "_id": "device-map"
      }
   };
var profileObj = {
    "selector": {
     "category": "profile"
      },
    "fields": [
      "name",
      "setting"
    ]
   };
var profileObj2 = {
    "selector": {
      "category": "profile"
      }
};
var obj_bind_list = {
    "selector": {
     "category": "device"
      },
      "fields": [
        "name",
        "profileName",
        "macAddr",
        "position"
      ],
      "sort": [
         {
            "create": "asc"
         }
      ]
   };
var bindObj2 = {
    "selector": {
      "category": "device"
      }
};

var deviceobj = {
    "selector": {
      "macAddr": "0000000004000493",
      "date": {
              "$gte": "2017-09-23T10:00",
              "$lt": "2017-09-24T12:00"
          }
    },
    "fields": [
      "date",
      "data",
      "information"
    ],
    "skip": 0
  }
var log_event_obj = {
    "selector": {
      "category": "log",
      "type": "event",
      "date": {
              "$gte": "2017-09-23T10:00",
              "$lt": "2017-09-24T12:00"
          }
      },
      "fields": [
        "date",
        "name",
        "common",
        "message"
      ]
   };

   var deviceobj2 = {
    "selector": {
      "macAddr": "0000000004000493",
      "time": {
              "$gte": "2017-09-23T10:00",
              "$lt": "2017-09-24T12:00"
          }
    },
    "fields": [
      "date",
      "data",
      "information"
    ],
    "skip": 0
  }

  var zoneObj = {
    "selector": {
       "category": "zone"
    },
    "fields": [
       "_id",
       "name",
       "deviceList",
       "create"
    ],
    "sort": [
       {
          "create": "asc"
       }
    ]
 };
var zoneObj2 = {
    "selector": {
      "category": "zone"
      }
};

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

function findDeviceList2(obj, callback){
  var myobj = JSON.parse(JSON.stringify(deviceobj2)); 
  
  
  if(obj.macAddr && obj.macAddr.length === 8){
    myobj.selector.macAddr = '00000000' + obj.macAddr;
  }else{
    myobj.selector.macAddr = obj.macAddr;
  }
  // var fromTimestamp = (new Date(obj.from)).getTime();
  // var toTimestamp = (new Date(obj.to)).getTime();
  myobj.selector.time.$gte = Number(obj.from);
  myobj.selector.time.$lt = Number(obj.to);
  console.log('findDeviceList myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
      var deviceList = [];
      if(value.docs.length > 0){
          deviceList = value.docs;
      }
      return callback(null,deviceList);
    }, function(reason) {
      return callback(reason);
    });
}

function findDeviceList(obj, callback){
  var myobj = JSON.parse(JSON.stringify(deviceobj)); 
  
  if(obj.macAddr && obj.macAddr.length === 8){
    myobj.selector.macAddr = '00000000' + obj.macAddr;
  }else{
    myobj.selector.macAddr = obj.macAddr;
  }
  myobj.selector.date.$gte = obj.from;
  myobj.selector.date.$lt = obj.to;
  console.log('findDeviceList myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
      var deviceList = [];
      if(value.docs.length > 0){
          deviceList = value.docs;
      }
      return callback(null,deviceList);
  }, function(reason) {
      return callback(reason);
  });
}

function findBindDevice(sort, callback){
  if (sort) {
    obj_bind_list.sort = sort;
  }
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

function addDeviceSetting(json,callback){
  json.category = 'device';
  dbUtil.insert(json).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Insert device setting success :"+value);
  }, function(reason) {
      console.log("???? Insert device setting fail :" + reason);
  }); 
}

function findDeviceMaps(callback){
  
  dbUtil.queryDoc(mapObj).then(function(value) {
      var deviceList = [];
      if(value.docs.length > 0){
          deviceList = value.docs;
      }
      return callback(null,deviceList);
    }, function(reason) {
      return callback(reason);
    });
}

function addProfile(json,callback){
  json.category = 'profile';
  json.create = new Date();
  dbUtil.insert(json).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Insert profile success :"+value);
      return callback('ok');
  }, function(reason) {
      console.log("???? Insert profile fail :" + reason);
      return callback('fail');
  }); 
}

function delProfile(name,callback){
  var myobj = JSON.parse(JSON.stringify(profileObj2)); 
  myobj.selector.name = name;
  console.log('delProfile myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
    var profileList = [];
    if(value.docs.length > 0){
      profileList = value.docs;
    }
    var profile = profileList[0];
    dbUtil.removeDoc(profile._id,profile._rev).then(function(value) {
      return callback('ok');
    }, function(reason) {
      return callback(reason);
    }); 
  
  }, function(reason) {
    return callback(reason);
  }); 
}

function updateProfile(newProfile,callback){
  var myobj = JSON.parse(JSON.stringify(profileObj2)); 
  myobj.selector.name = newProfile.name;
  console.log('updateProfile myobj : ' + JSON.stringify(myobj));
  
  dbUtil.queryDoc(myobj).then(function(value) {
    var profileList = [];
    if(value.docs.length > 0){
      profileList = value.docs;
    }
    var profile = profileList[0];
    console.log('profile._id : ' + profile._id)
    profile.setting = newProfile.setting;
    dbUtil.insert(profile).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Update profile success :"+ JSON.stringify(value));
      return callback('ok');
    }, function(reason) {
      // on rejection(已拒絕時)
      console.log("???? Update profile fail :" + reason);
      return callback(reason);
    });
  }, function(reason) {
    return callback(reason);
  }); 
}

function findProfileList(sort, callback){
  if (sort) {
    profileObj.sort = sort;
  }
  dbUtil.queryDoc(profileObj).then(function(value) {
      var profileList = [];
      if(value.docs.length > 0){
        profileList = value.docs;
      }
      return callback(null,profileList);
    }, function(reason) {
      return callback(reason);
    });
}

function addBindDevice(json,callback){
  json.category = 'device';
  json.create = new Date();
  dbUtil.insert(json).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Insert bind device success :"+value);
      return callback('ok');
  }, function(reason) {
      console.log("???? Insert bind device fail :" + reason);
      return callback('fail');
  }); 
}

function delBindDevice(name,callback){
  var myobj = JSON.parse(JSON.stringify(bindObj2)); 
  myobj.selector.name = name;
  console.log('delBindDevice myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
    var bindList = [];
    if(value.docs.length > 0){
      bindList = value.docs;
    }
    var bindDevice = bindList[0];
    dbUtil.removeDoc(bindDevice._id,bindDevice._rev).then(function(value) {
      return callback('ok');
    }, function(reason) {
      return callback(reason);
    }); 
  
  }, function(reason) {
    return callback(reason);
  }); 
}

function updateBindDevice(newDevice,callback){
  var myobj = JSON.parse(JSON.stringify(bindObj2)); 
  myobj.selector.name = newDevice.name;
  console.log('updateBindDevice myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
    var bindList = [];
    if(value.docs.length > 0){
      bindList = value.docs;
    }
    var bindDevice = bindList[0];
    console.log('bindDevice._id : ' + bindDevice._id)
    bindDevice.profileName = newDevice.profileName;
    bindDevice.position = newDevice.position;
    dbUtil.insert(bindDevice).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Update bind device success :"+ JSON.stringify(value));
      return callback('ok');
    }, function(reason) {
      // on rejection(已拒絕時)
      console.log("???? Update bind device fail :" + reason);
      return callback(reason);
    });
  }, function(reason) {
    return callback(reason);
  }); 
}

function findEventLists(obj, callback){
  var myobj = JSON.parse(JSON.stringify(log_event_obj));
  if (obj.macAddr) {
    if(obj.macAddr && obj.macAddr.length === 8){
      myobj.selector.common = '00000000' + obj.macAddr;
    }else{
      myobj.selector.common = obj.macAddr;
    }
  }
  myobj.selector.date.$gte = obj.from;
  myobj.selector.date.$lt = obj.to;
  console.log(new Date() + " findEventLists Query JSON :\n" +JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
      var deviceList = [];
      if(value.docs.length > 0){
          deviceList = value.docs;
      }
      return callback(null,deviceList);
    }, function(reason) {
      return callback(reason);
    });
}

function addZone(json,callback){
  json.category = 'zone';
  json.create = new Date();
  dbUtil.insert(json).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Insert zone success :"+value);
      return callback('ok');
  }, function(reason) {
      console.log("???? Insert zone fail :" + reason);
      return callback('fail');
  }); 
}

function delZone(name,callback){
  var myobj = JSON.parse(JSON.stringify(zoneObj2)); 
  myobj.selector.name = name;
  console.log('delProfile myobj : ' + JSON.stringify(myobj));
  dbUtil.queryDoc(myobj).then(function(value) {
    var zoneList = [];
    if(value.docs.length > 0){
      zoneList = value.docs;
    }
    var zone = zoneList[0];
    dbUtil.removeDoc(zone._id,zone._rev).then(function(value) {
      return callback('ok');
    }, function(reason) {
      return callback(reason);
    }); 
  
  }, function(reason) {
    return callback(reason);
  }); 
}

function updateZone(newZone,callback){
  var myobj = JSON.parse(JSON.stringify(zoneObj2)); 
  myobj.selector.name = newZone.name;
  console.log('updateZone myobj : ' + JSON.stringify(myobj));
  
  dbUtil.queryDoc(myobj).then(function(value) {
    var zoneList = [];
    if(value.docs.length > 0){
      zoneList = value.docs;
    }
    var zone = zoneList[0];
    console.log('zone._id : ' + zone._id)
    zone.deviceList = newZone.deviceList;
    dbUtil.insert(zone).then(function(value) {
      // on fulfillment(已實現時)
      console.log("#### Update zone success :"+ JSON.stringify(value));
      return callback('ok');
    }, function(reason) {
      // on rejection(已拒絕時)
      console.log("???? Update zone fail :" + reason);
      return callback(reason);
    });
  }, function(reason) {
    return callback(reason);
  }); 
}

function findZoneList(sort, callback){
  if (sort) {
    zoneObj.sort = sort;
  }
  dbUtil.queryDoc(zoneObj).then(function(value) {
      var profileList = [];
      if(value.docs.length > 0){
        profileList = value.docs;
      }
      return callback(null,profileList);
    }, function(reason) {
      return callback(reason);
    });
}

module.exports = {
    findFinalList,
    findDeviceList,
    findBindDevice,
    addDeviceSetting,
    findDeviceMaps,
    addProfile,
    delProfile,
    updateProfile,
    addBindDevice,
    delBindDevice,
    updateBindDevice,
    findProfileList,
    findEventLists,
    findDeviceList2,
    addZone,
    delZone,
    updateZone,
    findZoneList
  }