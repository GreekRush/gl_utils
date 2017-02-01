var Promise = require('bluebird');
var sugar = require('sugar');

module.exports = {
	isEmptyObject: isEmptyObject,
	isEmpty: isEmpty,
	isTrue: isTrue,
	isFalse: isFalse,
	propEquals: propEquals,
	strtotime: strtotime,
	convertVideoLinksToEmbeds: convertVideoLinksToEmbeds,
	overwriteObjectUndefineds: overwriteObjectUndefineds,
	capitalizeFirstLetter: capitalizeFirstLetter,
	getBasicHtml: getBasicHtml,
	nonEmptyValueOr: nonEmptyValueOr,
	fullHttpGet: fullHttpGet,
	fullHttpsGet: fullHttpsGet,
	chainDeferreds: chainDeferreds,
	chainDeferredFunctions: chainDeferredFunctions,
	rejectedPromise: rejectedPromise,
	resolvedPromise: resolvedPromise,
	arrayUnique: arrayUnique,
	deepLog: deepLog,
	objectHash: objectHash,
	objectToArray: objectToArray,
	setProperty: setProperty,
	pushIntoArray: pushIntoArray,
	removeEmptyKeys: removeEmptyKeys,
	convertRange: convertRange,
	checkRequiredFields: checkRequiredFields,
	hasObject: hasObject,
	setSessionUser: setSessionUser,
	isJsonString: isJsonString,
	parseUrlParams: parseUrlParams,
	setResultsKeys: setResultsKeys,
	mergeByKey: mergeByKey,
	flattenObject: flattenObject,
	unFlattenObject: unFlattenObject,
};


function isEmptyObject(obj) {
	for(var prop in obj){
		return false;
	}
	return true;
}

//allows deep object checking for empty (empty is 0, '', false, null, [], {}, undefined);
function isEmpty(_obj /*, level1, level2, ... levelN*/ ){
	var i = 0;
	
	var obj = _obj;
	
	while(i < arguments.length){
		if(i !== 0){
			obj = obj[arguments[i]];
		}
		
		//below is same as :
		// typeof obj === 'undefined'
		// || obj === null
		// || obj === false
		// || (typeof obj === 'string' && !obj)
		// || (typeof obj === 'number' && !obj)
		if(!obj){
			return true;
		}
		
		if(typeof obj.constructor !== 'undefined'){
			var proto = obj.constructor.prototype;
			
			if(
				(
					proto === Object.prototype			//plain object
					|| proto === Array.prototype		//plain array
				)
				&& isEmptyObject(obj)
			){
				return true;
				
				//NOTE: cannot just test length of array because a property may have been added to it (not pushed, added)
			}
		}
		
		i++;
	}
	
	return false;
}

//GET variables are string, POST variables are bool
function isTrue(param){
	return ['true', true].some(param);
}

//GET variables are string, POST variables are bool
function isFalse(param){
	return ['false', false].some(param);
}

//Utils.propEquals(obj, 'prop1', 'prop2', 123);		//returns true if obj.prop1.prop2 == 123
function propEquals(obj){
	/*var obj = arguments.slice(0, 1);
	 var val = arguments.pop();
	 
	 if(isEmpty.apply(this, arguments)){
	 return false;
	 }*/
	
	if(typeof obj === 'undefined'){
		return false;
	}
	
	for(var i = 1; i < arguments.length - 1; i++){
		var obj = obj[arguments[i]];
		if(typeof obj === 'undefined'){
			return false;
		}
	}
	
	return obj == arguments[arguments.length-1];
}

function strtotime(text){
	return parseInt(Date.create(text).getTime() / 1000);
}

function convertVideoLinksToEmbeds(string) {
	//youtube
	string = string.replace(/[a-zA-Z\/\/:\.]*youtube.com\/watch\?v=([a-zA-Z0-9\-_]+)([a-zA-Z0-9\/\*\-\_\?\&\;\%\=\.]*)/i, "<iframe class=\"embed\" src=\"//www.youtube.com/embed/$1\" frameborder=\"0\" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
	
	//vimeo
	string = string.replace(/[a-zA-Z\/\/:\.]*vimeo.com\/([a-zA-Z0-9\-_]+)([a-zA-Z0-9\/\*\-\_\?\&\;\%\=\.]*)/i, "<iframe class=\"embed\" src=\"//player.vimeo.com/video/$1\" frameborder=\"0\" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>");
	
	return string;
}

//will overwrite obj1 property values with those from obj2, unless they are already defined
function overwriteObjectUndefineds(obj1, obj2){
	for(var prop in obj2){
		if(typeof obj1[prop] === 'undefined'){
			obj1[prop] = obj2[prop];
		}
	}
	
	return obj1;
}

function capitalizeFirstLetter(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function getBasicHtml(body){
	return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>' + body + '</body></html>';
}

// Utils.nonEmptyValueOr(data, '_json.hometown.name', 'alternative');
function nonEmptyValueOr(object, dotString, otherValue){
	var keys = dotString.split('.');
	var isEmptyParams = [object].concat(keys);
	if(!isEmpty.apply(this, isEmptyParams)){
		var value = object;
		while(keys.length){
			value = value[keys.splice(0, 1)];
		}
		return value;
	}else{
		return otherValue;
	}
}

//removes the need to do chunking
function fullHttpGet(options, callback){
	var request = require('http').get(options, function(res){
		var data = '';
		
		res.on('data', function(chunk){
			data += chunk;
		}).on('error', function(e){
			callback(e);
			console.log(e.stack);
		}).on('end', function(){
			callback(null, data);
		});
	}).on('error', function(e){
		callback(e);
		console.log(e.stack);
	});
	
	request.setTimeout(5000, function(){
		request.abort();
		//callback('timed out');		error callback is handled in normail callback
	});
	
	request.end();
}

//removes the need to do chunking
function fullHttpsGet(options, callback){
	require('https').get(options, function(res){
		var data = '';
		
		res.on('data', function(chunk){
			data += chunk;
		});
		
		res.on('end', function(){
			callback(null, data);
		});
	}).on('error', function(e){
		callback(e);
	});
}

//this can never work because the deferred is ran at the time it is added to the deferreds array. must use chainDeferredFunctions below
function chainDeferreds(deferreds){
	/*return deferreds.reduce(function(previous, current){
	 return previous.then(current);
	 }, resolvedPromise());*/
	
	var promise = deferreds[0];
	for(var i = 1; i < deferreds.length; i++){
		promise = promise.then(deferreds[i]);
	}
	
	return deferreds[deferreds.length-1];
}

/*
 //https://github.com/kriskowal/q#sequences
 function chainDeferredFunctions(funcs){
 return funcs.reduce(q.when, q(null));
 *//*return funcs.reduce(function(soFar, f){
 return soFar.then(f);
 }, q(null));*//*
 }*/

function chainDeferredFunctions(funcs){
	return Promise.reduce(funcs, function(previousValue, task) {
		return task(previousValue);
	}, null);
}

/*function rejectedPromise(error){
 var deferred = Promise.defer();
 deferred.reject(error);
 return deferred.promise;
 }*/

function rejectedPromise(error, props){
	var deferred = Promise.defer();
	
	error = error instanceof Array ? error.map(function(error){
									   return transformError(error, props);
								   }) : transformError(error, props);
	
	deferred.reject(error);
	
	return deferred.promise;
}

function resolvedPromise(data){
	var deferred = Promise.defer();
	deferred.resolve(data);
	return deferred.promise;
}

function arrayUnique(array){
	return array.unique();		//added with sugarjs
}

function deepLog(){
	objectToArray(arguments).forEach(function(arg){
		//if(typeof arg === 'object'){
		console.log(require('util').inspect(arg, true, 100));
		//}else{
		//	console.log(arg);
		//}
	});
}

//creates a unique hash of an object
//	http://stackoverflow.com/a/8076436
function objectHash(obj){
	var objString = JSON.stringify(obj);
	var hash = 0;
	if(objString.length === 0){
		return hash;
	}
	for(var i = 0; i < objString.length; i++){
		var character = objString.charCodeAt(i);
		hash = ((hash << 5) - hash) + character;
		hash = hash & hash; // Convert to 32bit integer
	}
	return 'c' + hash;
}

function objectToArray(obj){
	var values = [];
	var keys = Object.keys(obj);
	for(var i = 0; i < keys.length; i++){
		var key = keys[i];
		values.push(obj[key]);
	}
	return values;
}

//setProperty(obj, 'prop, 'subprop', 'subsubprop', 314);
function setProperty(obj){
	if(arguments.length < 3){
		console.log('Utils.setProperty: less than 3 arguments');
		return false;
	}
	if(typeof obj !== 'object'){
		console.log('Utils.setProperty: first argument is not an object');
		return false;
	}
	
	var tempObj = obj;
	
	for(var i = 1; i < arguments.length - 1; i++){
		if(typeof arguments[i] !== 'string'){
			console.log('Utils.setProperty: argument ' + i + ' is not a string');
			return false;
		}
		
		if(i < arguments.length - 2){
			if(typeof tempObj[arguments[i]] === 'undefined'){
				tempObj[arguments[i]] = {};
			}
			else if(typeof tempObj[arguments[i]] !== 'object'){
				console.log('Utils.setProperty: object at property ' + arguments[i] + ' is not an object');
				return false;
			}
			
			tempObj = tempObj[arguments[i]];
		}
	}
	
	tempObj[arguments[arguments.length - 2]] = arguments[arguments.length - 1];
}

//makes sure that prop or obj is an array
function pushIntoArray(obj, prop, item){
	if(!(obj[prop] instanceof Array)){
		if(typeof obj[prop] == 'undefined'){
			obj[prop] = [];
		}else{
			obj[prop] = [obj[prop]];
		}
	}
	
	obj[prop].push(item);
}

//modifies original obj
function removeEmptyKeys(obj){
	Object.keys(obj).forEach(function(key){
		if(!obj[key]){
			delete obj[key];
		}
	});
	
	return obj;
}

//converts a number's value in one range to it's corresponding value in another range
function convertRange(value, r1, r2){
	return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
}

//fields can be object or array
function checkRequiredFields(data, fields, errors){
	var obj = {};
	var keys = [];
	if(fields instanceof Array){
		for(var i = 0; i < fields.length; i++){
			var field = fields[i];
			obj[field] = field;
			keys.push(field);
		}
	}else{
		obj = fields;
		keys = Object.keys(obj);
	}
	
	for(var i = 0; i < keys.length; i++){
		var key = keys[i];
		
		if(typeof data === 'undefined' || typeof data[key] === 'undefined'){
			errors.push('ERROR: ' + obj[key] + ' is required');
		}
	}
}

//determines if array has a object who's key matches value
function hasObject(objects, key, value){
	return objects.some(function(object){
		return object[key] == value;
	});
}

//turns the session save method into a promise
function setSessionUser(req, user){
	var deferred = Promise.defer();
	
	req.session.user = user;
	req.session.save(function(){
		deferred.resolve(user);
	});
	
	return deferred.promise;
}

function isJsonString(str){
	try{
		JSON.parse(str);
	}catch(e){
		return false;
	}
	return true;
}

function transformError(error, props){
	if(typeof error === 'string'){
		error = new Error(error);
	}
	
	if(typeof props !== 'undefined'){
		for(var prop in props){
			error[prop] = props[prop];
		}
	}
	if(typeof error.type === 'undefined' && error.message.substr(0, 7) !== 'ERROR: '){
		error.type = 'internal';
	}
	
	return error;
}

function parseUrlParams(format, url){
	var formatParts = format.split('/');
	var urlParts = url.split('/');
	
	var params = {};
	
	for(var i = 0; i < Math.min(formatParts.length, urlParts.length); i++){
		if(formatParts[i][0] === ':'){
			params[formatParts[i].substr(1)] = urlParts[i];
		}
		else if(formatParts[i] !== urlParts[i]){
			throw new Error('mismatched urls: ', format, url);
		}
	}
	
	return params;
}

// takes an array of db results and returns an object of the same values but with "key" as the key value
function setResultsKeys(results, key){
	var resultsByKey = {};
	
	for(var i = 0; i < results.length; i++){
		var result = results[i];
		resultsByKey[result[key]] = result;
	}
	
	return resultsByKey;
}

//merges rows from arr2 into the matching (by key) row from arr1 
function mergeByKey(arr1, arr2, key){
	var arr2ByIds = setResultsKeys(arr2, key);
	
	for(var i = 0; i < arr1.length; i++){
		var user = arr1[i];
		
		if(!isEmpty(arr2ByIds, user.Users_id)){
			Object.merge(user, arr2ByIds[user.Users_id]);
		}
	}
	
	return arr1;		//arr1 is updated by reference, but return it anyway
}

function flattenObject(obj){
	var result = {};
	function recurse (cur, prop) {
		if (Object(cur) !== cur) {
			result[prop] = cur;
		} else if (Array.isArray(cur)) {
			for(var i=0, l=cur.length; i<l; i++)
				recurse(cur[i], prop + "[" + i + "]");
			if (l == 0)
				result[prop] = [];
		} else {
			var isEmpty = true;
			for (var p in cur) {
				isEmpty = false;
				recurse(cur[p], prop ? prop+"."+p : p);
			}
			if (isEmpty && prop)
				result[prop] = {};
		}
	}
	recurse(obj, "");
	return result;
}

function unFlattenObject(obj){
	if (Object(obj) !== obj || Array.isArray(obj))
		return obj;
	var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
		resultholder = {};
	for (var p in obj) {
		var cur = resultholder,
			prop = "",
			m;
		while (m = regex.exec(p)) {
			cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
			prop = m[2] || m[1];
		}
		cur[prop] = obj[p];
	}
	return resultholder[""] || resultholder;
}