var aa00Data = { 'temperature':[6,10,100], 'humidity':[10,14,100], 'voltage':[14,18,1] };
var aa01Data = { 'pressure':[6,10,1],'hight':[10,14,1],'temperature':[14,16,1], 'humidity':[16,18,1], 'light':[18,22,1] };
var aa02Data = {'uv':[6,10,1],'rain':[10,14,1]};
var aa10Data = {'ph':[6,10,100],'do':[10,14,100],'cond':[14,20,1000],'temperature':[20,24,100],'ntu':[24,28,100],'voltage':[28,32,1]};
var path = './public/data/parseMap.json';
var JsonFileTools =  require('./jsonFileTools.js');
var dbUtil =  require('./dbUtil.js');
var deviceMapRev = '';

exports.getDeviceMapRev = function(data,fport) {
    return deviceMapRev;
}

exports.getTypeData = function(data,obj) {
    var info = {};
    
    var keys = Object.keys(obj);
    var count = keys.length;
    for(var i =0;i<count;i++){
        //console.log( keys[i]+' : '+ obj[keys[i]]);
        info[keys[i]] = getIntData(obj[keys[i]],data);
        console.log(keys[i] + ' : ' + info[keys[i]]);
    }
    return info;
};

function getIntData(arrRange,data){
    var ret = {};
    var start = arrRange[0];
    var end = arrRange[1];
    var diff = arrRange[2];
    var intData = parseInt(data.substring(start,end),16);
    return getDiffValue(intData, diff)
}

function getDiffValue(data, diff) {
    value = 0;
    if(diff === 11){
        value = 7*(data + 1)*3.3/4096;
    } else if (diff === 12) {
        value = 10*(data + 1)*3.3/4096;
    } else {
        value = data/diff;
    }
    return value.toFixed(2);
}