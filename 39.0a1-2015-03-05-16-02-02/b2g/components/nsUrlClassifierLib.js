


const Cc=Components.classes;const Ci=Components.interfaces;const G_GDEBUG=false;Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");this.BindToObject=function BindToObject(fn,self,opt_args){var boundargs=fn.boundArgs_||[];boundargs=boundargs.concat(Array.slice(arguments,2,arguments.length));if(fn.boundSelf_)
self=fn.boundSelf_;if(fn.boundFn_)
fn=fn.boundFn_;var newfn=function(){ var args=boundargs.concat(Array.slice(arguments));return fn.apply(self,args);}
newfn.boundArgs_=boundargs;newfn.boundSelf_=self;newfn.boundFn_=fn;return newfn;}
Function.prototype.inherits=function(parentCtor){var tempCtor=function(){};tempCtor.prototype=parentCtor.prototype;this.superClass_=parentCtor.prototype;this.prototype=new tempCtor();}












this.G_Preferences=function G_Preferences(opt_startPoint,opt_getDefaultBranch){this.debugZone="prefs";this.observers_={};this.getDefaultBranch_=!!opt_getDefaultBranch;this.startPoint_=opt_startPoint||null;}
G_Preferences.setterMap_={"string":"setCharPref","boolean":"setBoolPref","number":"setIntPref"};G_Preferences.getterMap_={};G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_STRING]="getCharPref";G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_BOOL]="getBoolPref";G_Preferences.getterMap_[Ci.nsIPrefBranch.PREF_INT]="getIntPref";G_Preferences.prototype.__defineGetter__('prefs_',function(){var prefs;var prefSvc=Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);if(this.getDefaultBranch_){prefs=prefSvc.getDefaultBranch(this.startPoint_);}else{prefs=prefSvc.getBranch(this.startPoint_);} 
prefs.QueryInterface(Ci.nsIPrefBranchInternal);return prefs;});G_Preferences.prototype.setPref=function(key,val){var datatype=typeof(val);if(datatype=="number"&&(val%1!=0)){throw new Error("Cannot store non-integer numbers in preferences.");}
var meth=G_Preferences.setterMap_[datatype];if(!meth){throw new Error("Pref datatype {"+datatype+"} not supported.");}
return this.prefs_[meth](key,val);}
G_Preferences.prototype.getPref=function(key,opt_default){var type=this.prefs_.getPrefType(key); if(type==Ci.nsIPrefBranch.PREF_INVALID){return opt_default;}
var meth=G_Preferences.getterMap_[type];if(!meth){throw new Error("Pref datatype {"+type+"} not supported.");}

try{return this.prefs_[meth](key);}catch(e){return opt_default;}}
G_Preferences.prototype.clearPref=function(which){try{
 this.prefs_.clearUserPref(which);}catch(e){}}
G_Preferences.prototype.addObserver=function(which,callback){ if(!this.observers_[which])
this.observers_[which]={callbacks:[],observers:[]};if(this.observers_[which].callbacks.indexOf(callback)==-1){var observer=new G_PreferenceObserver(callback);this.observers_[which].callbacks.push(callback);this.observers_[which].observers.push(observer);this.prefs_.addObserver(which,observer,false );}}
G_Preferences.prototype.removeObserver=function(which,callback){var ix=this.observers_[which].callbacks.indexOf(callback);G_Assert(this,ix!=-1,"Tried to unregister a nonexistent observer");this.observers_[which].callbacks.splice(ix,1);var observer=this.observers_[which].observers.splice(ix,1)[0];this.prefs_.removeObserver(which,observer);}
G_Preferences.prototype.removeAllObservers=function(){for(var which in this.observers_){for each(var observer in this.observers_[which].observers){this.prefs_.removeObserver(which,observer);}}
this.observers_={};}
this.G_PreferenceObserver=function G_PreferenceObserver(callback){this.debugZone="prefobserver";this.callback_=callback;}
G_PreferenceObserver.prototype.observe=function(subject,topic,data){G_Debug(this,"Observed pref change: "+data);this.callback_(data);}
G_PreferenceObserver.prototype.QueryInterface=function(iid){if(iid.equals(Ci.nsISupports)||iid.equals(Ci.nsIObserver)||iid.equals(Ci.nsISupportsWeakReference))
return this;throw Components.results.NS_ERROR_NO_INTERFACE;}
this.G_Debug=function G_Debug(who,msg){}
this.G_Assert=function G_Assert(who,condition,msg){}
this.G_Error=function G_Error(who,msg){}
this.G_debugService={__noSuchMethod__:function(){}};










this.G_Alarm=function G_Alarm(callback,delayMS,opt_repeating,opt_maxTimes){this.debugZone="alarm";this.callback_=callback;this.repeating_=!!opt_repeating;this.timer_=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);var type=opt_repeating?this.timer_.TYPE_REPEATING_SLACK:this.timer_.TYPE_ONE_SHOT;this.maxTimes_=opt_maxTimes?opt_maxTimes:null;this.nTimes_=0;this.observerServiceObserver_=new G_ObserverServiceObserver('xpcom-shutdown',BindToObject(this.cancel,this)); this.timer_.initWithCallback(this,delayMS,type);}
G_Alarm.prototype.cancel=function(){if(!this.timer_){return;}
this.timer_.cancel();
this.timer_=null;this.callback_=null; this.observerServiceObserver_.unregister();}
G_Alarm.prototype.notify=function(timer){ var ret=this.callback_(); this.nTimes_++;if(this.repeating_&&typeof this.maxTimes_=="number"&&this.nTimes_>=this.maxTimes_){this.cancel();}else if(!this.repeating_){ this.cancel();}

return ret;}
G_Alarm.prototype.setDelay=function(delay){this.timer_.delay=delay;}
G_Alarm.prototype.QueryInterface=function(iid){if(iid.equals(Components.interfaces.nsISupports)||iid.equals(Components.interfaces.nsITimerCallback))
return this;throw Components.results.NS_ERROR_NO_INTERFACE;}
this.G_ConditionalAlarm=function G_ConditionalAlarm(callback,delayMS,opt_repeating,opt_maxTimes){G_Alarm.call(this,callback,delayMS,opt_repeating,opt_maxTimes);this.debugZone="conditionalalarm";}
G_ConditionalAlarm.inherits=function(parentCtor){var tempCtor=function(){};tempCtor.prototype=parentCtor.prototype;this.superClass_=parentCtor.prototype;this.prototype=new tempCtor();}
G_ConditionalAlarm.inherits(G_Alarm);G_ConditionalAlarm.prototype.notify=function(timer){ var rv=G_Alarm.prototype.notify.call(this,timer);if(this.repeating_&&rv){G_Debug(this,"Callback of a repeating alarm returned true; cancelling.");this.cancel();}}






this.G_CryptoHasher=function G_CryptoHasher(){this.debugZone="cryptohasher";this.hasher_=null;}
G_CryptoHasher.algorithms={MD2:Ci.nsICryptoHash.MD2,MD5:Ci.nsICryptoHash.MD5,SHA1:Ci.nsICryptoHash.SHA1,SHA256:Ci.nsICryptoHash.SHA256,SHA384:Ci.nsICryptoHash.SHA384,SHA512:Ci.nsICryptoHash.SHA512,};G_CryptoHasher.prototype.init=function(algorithm){var validAlgorithm=false;for(var alg in G_CryptoHasher.algorithms)
if(algorithm==G_CryptoHasher.algorithms[alg])
validAlgorithm=true;if(!validAlgorithm)
throw new Error("Invalid algorithm: "+algorithm);this.hasher_=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);this.hasher_.init(algorithm);}
G_CryptoHasher.prototype.updateFromString=function(input){if(!this.hasher_)
throw new Error("You must initialize the hasher first!");var stream=Cc['@mozilla.org/io/string-input-stream;1'].createInstance(Ci.nsIStringInputStream);stream.setData(input,input.length);this.updateFromStream(stream);}
G_CryptoHasher.prototype.updateFromArray=function(input){if(!this.hasher_)
throw new Error("You must initialize the hasher first!");this.hasher_.update(input,input.length);}
G_CryptoHasher.prototype.updateFromStream=function(stream){if(!this.hasher_)
throw new Error("You must initialize the hasher first!");if(stream.available())
this.hasher_.updateFromStream(stream,stream.available());}
G_CryptoHasher.prototype.digestRaw=function(){var digest=this.hasher_.finish(false );this.hasher_=null;return digest;}
G_CryptoHasher.prototype.digestBase64=function(){var digest=this.hasher_.finish(true );this.hasher_=null;return digest;}
G_CryptoHasher.prototype.digestHex=function(){var raw=this.digestRaw();return this.toHex_(raw);}
G_CryptoHasher.prototype.toHex_=function(str){var hexchars='0123456789ABCDEF';var hexrep=new Array(str.length*2);for(var i=0;i<str.length;++i){hexrep[i*2]=hexchars.charAt((str.charCodeAt(i)>>4)&15);hexrep[i*2+1]=hexchars.charAt(str.charCodeAt(i)&15);}
return hexrep.join('');}
this.G_ObserverWrapper=function G_ObserverWrapper(topic,observeFunction){this.debugZone="observer";this.topic_=topic;this.observeFunction_=observeFunction;}
G_ObserverWrapper.prototype.QueryInterface=function(iid){if(iid.equals(Ci.nsISupports)||iid.equals(Ci.nsIObserver))
return this;throw Components.results.NS_ERROR_NO_INTERFACE;}
G_ObserverWrapper.prototype.observe=function(subject,topic,data){if(topic==this.topic_)
this.observeFunction_(subject,topic,data);}
this.G_ObserverServiceObserver=function G_ObserverServiceObserver(topic,observeFunction,opt_onlyOnce){this.debugZone="observerserviceobserver";this.topic_=topic;this.observeFunction_=observeFunction;this.onlyOnce_=!!opt_onlyOnce;this.observer_=new G_ObserverWrapper(this.topic_,BindToObject(this.observe_,this));this.observerService_=Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);this.observerService_.addObserver(this.observer_,this.topic_,false);}
G_ObserverServiceObserver.prototype.unregister=function(){this.observerService_.removeObserver(this.observer_,this.topic_);this.observerService_=null;}
G_ObserverServiceObserver.prototype.observe_=function(subject,topic,data){this.observeFunction_(subject,topic,data);if(this.onlyOnce_)
this.unregister();}



 
this.G_Protocol4Parser=function G_Protocol4Parser(){this.debugZone="protocol4";this.protocol4RegExp_=new RegExp("([^:]+):\\d+:(.*)$");this.newlineRegExp_=new RegExp("(\\r)?\\n");}
G_Protocol4Parser.prototype.parse=function(text){var response={};if(!text)
return response; var lines=text.split(this.newlineRegExp_);for(var i=0;i<lines.length;i++)
if(this.protocol4RegExp_.exec(lines[i]))
response[RegExp.$1]=RegExp.$2;return response;}
G_Protocol4Parser.prototype.serialize=function(map){if(typeof map!="object")
throw new Error("map must be an object");var text="";for(var key in map){if(typeof map[key]!="string")
throw new Error("Keys and values must be strings");text+=key+":"+map[key].length+":"+map[key]+"\n";}
return text;}





this.HTTP_FOUND=302;this.HTTP_SEE_OTHER=303;this.HTTP_TEMPORARY_REDIRECT=307;this.RequestBackoff=function RequestBackoff(maxErrors,retryIncrement,maxRequests,requestPeriod,timeoutIncrement,maxTimeout){this.MAX_ERRORS_=maxErrors;this.RETRY_INCREMENT_=retryIncrement;this.MAX_REQUESTS_=maxRequests;this.REQUEST_PERIOD_=requestPeriod;this.TIMEOUT_INCREMENT_=timeoutIncrement;this.MAX_TIMEOUT_=maxTimeout; this.requestTimes_=[];this.numErrors_=0;this.errorTimeout_=0;this.nextRequestTime_=0;}
RequestBackoff.prototype.reset=function(){this.numErrors_=0;this.errorTimeout_=0;this.nextRequestTime_=0;}
RequestBackoff.prototype.canMakeRequest=function(){var now=Date.now();if(now<this.nextRequestTime_){return false;}
return(this.requestTimes_.length<this.MAX_REQUESTS_||(now-this.requestTimes_[0])>this.REQUEST_PERIOD_);}
RequestBackoff.prototype.noteRequest=function(){var now=Date.now();this.requestTimes_.push(now); if(this.requestTimes_.length>this.MAX_REQUESTS_)
this.requestTimes_.shift();}
RequestBackoff.prototype.nextRequestDelay=function(){return Math.max(0,this.nextRequestTime_-Date.now());}
RequestBackoff.prototype.noteServerResponse=function(status){if(this.isErrorStatus(status)){this.numErrors_++;if(this.numErrors_<this.MAX_ERRORS_)
this.errorTimeout_=this.RETRY_INCREMENT_;else if(this.numErrors_==this.MAX_ERRORS_)
this.errorTimeout_=this.TIMEOUT_INCREMENT_;else
this.errorTimeout_*=2;this.errorTimeout_=Math.min(this.errorTimeout_,this.MAX_TIMEOUT_);this.nextRequestTime_=Date.now()+this.errorTimeout_;}else{this.reset();}}
RequestBackoff.prototype.isErrorStatus=function(status){return((400<=status&&status<=599)||HTTP_FOUND==status||HTTP_SEE_OTHER==status||HTTP_TEMPORARY_REDIRECT==status);}





this.PROT_NewXMLHttpRequest=function PROT_NewXMLHttpRequest(){var Cc=Components.classes;var Ci=Components.interfaces;var request=Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest); request.QueryInterface(Ci.nsIJSXMLHttpRequest);return request;}
this.PROT_XMLFetcher=function PROT_XMLFetcher(){this.debugZone="xmlfetcher";this._request=PROT_NewXMLHttpRequest(); this.appId=Ci.nsIScriptSecurityManager.SAFEBROWSING_APP_ID;this.isInBrowserElement=false;this.usePrivateBrowsing=false;this.isContent=false;}
PROT_XMLFetcher.prototype={_callback:null,get:function(page,callback){this._request.abort(); this._request=PROT_NewXMLHttpRequest();this._callback=callback;var asynchronous=true;this._request.open("GET",page,asynchronous);this._request.channel.notificationCallbacks=this; var self=this;this._request.addEventListener("readystatechange",function(){self.readyStateChange(self);},false);this._request.send(null);},cancel:function(){this._request.abort();this._request=null;},readyStateChange:function(fetcher){if(fetcher._request.readyState!=4)
return;



var responseText=null;var status=Components.results.NS_ERROR_NOT_AVAILABLE;try{G_Debug(this,"xml fetch status code: \""+
fetcher._request.status+"\"");status=fetcher._request.status;responseText=fetcher._request.responseText;}catch(e){G_Debug(this,"Caught exception trying to read xmlhttprequest "+"status/response.");G_Debug(this,e);}
if(fetcher._callback)
fetcher._callback(responseText,status);}, getInterface:function(iid){return this.QueryInterface(iid);},QueryInterface:XPCOMUtils.generateQI([Ci.nsIInterfaceRequestor,Ci.nsISupports,Ci.nsILoadContext])};var lib=this;function UrlClassifierLib(){this.wrappedJSObject=lib;}
UrlClassifierLib.prototype.classID=Components.ID("{26a4a019-2827-4a89-a85c-5931a678823a}");UrlClassifierLib.prototype.QueryInterface=XPCOMUtils.generateQI([]);this.NSGetFactory=XPCOMUtils.generateNSGetFactory([UrlClassifierLib]);