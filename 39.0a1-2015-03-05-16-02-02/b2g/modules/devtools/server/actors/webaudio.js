"use strict";const{Cc,Ci,Cu,Cr}=require("chrome");const Services=require("Services");const{Promise:promise}=Cu.import("resource://gre/modules/Promise.jsm",{});const events=require("sdk/event/core");const{on:systemOn,off:systemOff}=require("sdk/system/events");const protocol=require("devtools/server/protocol");const{CallWatcherActor,CallWatcherFront}=require("devtools/server/actors/call-watcher");const{ThreadActor}=require("devtools/server/actors/script");const AutomationTimeline=require("./utils/automation-timeline");const{on,once,off,emit}=events;const{types,method,Arg,Option,RetVal}=protocol;const AUDIO_NODE_DEFINITION=require("devtools/server/actors/utils/audionodes.json");const ENABLE_AUTOMATION=false;const AUTOMATION_GRANULARITY=2000;const AUTOMATION_GRANULARITY_MAX=6000;const AUDIO_GLOBALS=["AudioContext","AudioNode","AudioParam"];const NODE_CREATION_METHODS=["createBufferSource","createMediaElementSource","createMediaStreamSource","createMediaStreamDestination","createScriptProcessor","createAnalyser","createGain","createDelay","createBiquadFilter","createWaveShaper","createPanner","createConvolver","createChannelSplitter","createChannelMerger","createDynamicsCompressor","createOscillator","createStereoPanner"];const AUTOMATION_METHODS=["setValueAtTime","linearRampToValueAtTime","exponentialRampToValueAtTime","setTargetAtTime","setValueCurveAtTime","cancelScheduledValues"];const NODE_ROUTING_METHODS=["connect","disconnect"];types.addActorType("audionode");let AudioNodeActor=exports.AudioNodeActor=protocol.ActorClass({typeName:"audionode",initialize:function(conn,node){protocol.Actor.prototype.initialize.call(this,conn);
this.nativeID=node.id;this.node=Cu.getWeakReference(node);this.automation={};try{this.type=getConstructorName(node);}catch(e){this.type="";} 
Object.keys(AUDIO_NODE_DEFINITION[this.type].properties||{}).filter(isAudioParam.bind(null,node)).forEach(paramName=>{this.automation[paramName]=new AutomationTimeline(node[paramName].defaultValue);});},getType:method(function(){return this.type;},{response:{type:RetVal("string")}}),isSource:method(function(){return!!~this.type.indexOf("Source")||this.type==="OscillatorNode";},{response:{source:RetVal("boolean")}}),isBypassed:method(function(){let node=this.node.get();if(node===null){return false;} 
return!!node.passThrough;},{response:{bypassed:RetVal("boolean")}}),bypass:method(function(enable){let node=this.node.get();if(node===null){return;}
let bypassable=!AUDIO_NODE_DEFINITION[this.type].unbypassable;if(bypassable){node.passThrough=enable;}
return this.isBypassed();},{request:{enable:Arg(0,"boolean")},response:{bypassed:RetVal("boolean")}}),setParam:method(function(param,value){let node=this.node.get();if(node===null){return CollectedAudioNodeError();}
try{if(isAudioParam(node,param)){node[param].value=value;this.automation[param].setValue(value);}
else{node[param]=value;}
return undefined;}catch(e){return constructError(e);}},{request:{param:Arg(0,"string"),value:Arg(1,"nullable:primitive")},response:{error:RetVal("nullable:json")}}),getParam:method(function(param){let node=this.node.get();if(node===null){return CollectedAudioNodeError();}
let value=isAudioParam(node,param)?node[param].value:node[param];
let grip;try{grip=ThreadActor.prototype.createValueGrip(value);}
catch(e){grip=createObjectGrip(value);}
return grip;},{request:{param:Arg(0,"string")},response:{text:RetVal("nullable:primitive")}}),getParamFlags:method(function(param){return((AUDIO_NODE_DEFINITION[this.type]||{}).properties||{})[param];},{request:{param:Arg(0,"string")},response:{flags:RetVal("nullable:primitive")}}),getParams:method(function(param){let props=Object.keys(AUDIO_NODE_DEFINITION[this.type].properties||{});return props.map(prop=>({param:prop,value:this.getParam(prop),flags:this.getParamFlags(prop)}));},{response:{params:RetVal("json")}}),connectParam:method(function(destActor,paramName,output){let srcNode=this.node.get();let destNode=destActor.node.get();if(srcNode===null||destNode===null){return CollectedAudioNodeError();}
try{


XPCNativeWrapper.unwrap(srcNode).connect(destNode[paramName],output);}catch(e){return constructError(e);}},{request:{destActor:Arg(0,"audionode"),paramName:Arg(1,"string"),output:Arg(2,"nullable:number")},response:{error:RetVal("nullable:json")}}),connectNode:method(function(destActor,output,input){let srcNode=this.node.get();let destNode=destActor.node.get();if(srcNode===null||destNode===null){return CollectedAudioNodeError();}
try{


XPCNativeWrapper.unwrap(srcNode).connect(destNode,output,input);}catch(e){return constructError(e);}},{request:{destActor:Arg(0,"audionode"),output:Arg(1,"nullable:number"),input:Arg(2,"nullable:number")},response:{error:RetVal("nullable:json")}}),disconnect:method(function(destActor,output){let node=this.node.get();if(node===null){return CollectedAudioNodeError();}
try{
XPCNativeWrapper.unwrap(node).disconnect(output);}catch(e){return constructError(e);}},{request:{output:Arg(0,"nullable:number")},response:{error:RetVal("nullable:json")}}),getAutomationData:method(function(paramName){let timeline=this.automation[paramName];if(!timeline){return null;}
let events=timeline.events;let values=[];let i=0;if(!timeline.events.length){return{events,values};}
let firstEvent=events[0];let lastEvent=events[timeline.events.length-1];
let timeDelta=(lastEvent.time+lastEvent.duration)-firstEvent.time;let scale=timeDelta/AUTOMATION_GRANULARITY;for(;i<AUTOMATION_GRANULARITY;i++){let delta=firstEvent.time+(i*scale);let value=timeline.getValueAtTime(delta);values.push({delta,value});}



if(lastEvent.type==="setTargetAtTime"){for(;i<AUTOMATION_GRANULARITY_MAX;i++){let delta=firstEvent.time+(++i*scale);let value=timeline.getValueAtTime(delta);values.push({delta,value});}}
return{events,values};},{request:{paramName:Arg(0,"string")},response:{values:RetVal("nullable:json")}}),addAutomationEvent:method(function(paramName,eventName,args=[]){let node=this.node.get();let timeline=this.automation[paramName];if(node===null){return CollectedAudioNodeError();}
if(!timeline||!node[paramName][eventName]){return InvalidCommandError();}
try{





let param=XPCNativeWrapper.unwrap(node[paramName]);let contentGlobal=Cu.getGlobalForObject(param);let contentArgs=Cu.cloneInto(args,contentGlobal);

if(eventName==="setValueCurveAtTime"){
let curve=new contentGlobal.Float32Array(contentArgs[0]);contentArgs[0]=curve;}


param[eventName].apply(param,contentArgs);}catch(e){return constructError(e);}},{request:{paramName:Arg(0,"string"),eventName:Arg(1,"string"),args:Arg(2,"nullable:json")},response:{error:RetVal("nullable:json")}}),_recordAutomationEvent:function(paramName,eventName,args){let timeline=this.automation[paramName];timeline[eventName].apply(timeline,args);}});let AudioNodeFront=protocol.FrontClass(AudioNodeActor,{initialize:function(client,form){protocol.Front.prototype.initialize.call(this,client,form);
if(form){this.manage(this);}}});let WebAudioActor=exports.WebAudioActor=protocol.ActorClass({typeName:"webaudio",initialize:function(conn,tabActor){protocol.Actor.prototype.initialize.call(this,conn);this.tabActor=tabActor;this._onContentFunctionCall=this._onContentFunctionCall.bind(this);
this._nativeToActorID=new Map();this._onDestroyNode=this._onDestroyNode.bind(this);this._onGlobalDestroyed=this._onGlobalDestroyed.bind(this);this._onGlobalCreated=this._onGlobalCreated.bind(this);},destroy:function(conn){protocol.Actor.prototype.destroy.call(this,conn);this.finalize();},getDefinition:method(function(){return AUDIO_NODE_DEFINITION;},{response:{definition:RetVal("json")}}),setup:method(function({reload}){
 this._firstNodeCreated=false;
this._nativeToActorID.clear();if(this._initialized){return;}
this._initialized=true;this._callWatcher=new CallWatcherActor(this.conn,this.tabActor);this._callWatcher.onCall=this._onContentFunctionCall;this._callWatcher.setup({tracedGlobals:AUDIO_GLOBALS,startRecording:true,performReload:reload,holdWeak:true,storeCalls:false});
 on(this.tabActor,"window-ready",this._onGlobalCreated);
on(this.tabActor,"window-destroyed",this._onGlobalDestroyed);},{request:{reload:Option(0,"boolean")},oneway:true}),_onContentFunctionCall:function(functionCall){let{name}=functionCall.details;
 if(WebAudioFront.NODE_ROUTING_METHODS.has(name)){this._handleRoutingCall(functionCall);}
else if(WebAudioFront.NODE_CREATION_METHODS.has(name)){this._handleCreationCall(functionCall);}
else if(ENABLE_AUTOMATION&&WebAudioFront.AUTOMATION_METHODS.has(name)){this._handleAutomationCall(functionCall);}},_handleRoutingCall:function(functionCall){let{caller,args,name}=functionCall.details;let source=caller;let dest=args[0];let isAudioParam=dest?getConstructorName(dest)==="AudioParam":false;if(name==="connect"&&isAudioParam){this._onConnectParam(source,dest);}
else if(name==="connect"){this._onConnectNode(source,dest);}
else if(name==="disconnect"){this._onDisconnectNode(source);}},_handleCreationCall:function(functionCall){let{caller,result}=functionCall.details;


if(!this._firstNodeCreated){
 this._onStartContext();this._onCreateNode(caller.destination);this._firstNodeCreated=true;}
this._onCreateNode(result);},_handleAutomationCall:function(functionCall){let{caller,name,args}=functionCall.details;let wrappedParam=new XPCNativeWrapper(caller);
 args=sanitizeAutomationArgs(args);let nodeActor=this._getActorByNativeID(wrappedParam._parentID);nodeActor._recordAutomationEvent(wrappedParam._paramName,name,args);this._onAutomationEvent({node:nodeActor,paramName:wrappedParam._paramName,eventName:name,args:args});},finalize:method(function(){if(!this._initialized){return;}
this._initialized=false;systemOff("webaudio-node-demise",this._onDestroyNode);off(this.tabActor,"window-destroyed",this._onGlobalDestroyed);off(this.tabActor,"window-ready",this._onGlobalCreated);this.tabActor=null;this._nativeToActorID=null;this._callWatcher.eraseRecording();this._callWatcher.finalize();this._callWatcher=null;},{oneway:true}),events:{"start-context":{type:"startContext"},"connect-node":{type:"connectNode",source:Option(0,"audionode"),dest:Option(0,"audionode")},"disconnect-node":{type:"disconnectNode",source:Arg(0,"audionode")},"connect-param":{type:"connectParam",source:Option(0,"audionode"),dest:Option(0,"audionode"),param:Option(0,"string")},"change-param":{type:"changeParam",source:Option(0,"audionode"),param:Option(0,"string"),value:Option(0,"string")},"create-node":{type:"createNode",source:Arg(0,"audionode")},"destroy-node":{type:"destroyNode",source:Arg(0,"audionode")},"automation-event":{type:"automationEvent",node:Option(0,"audionode"),paramName:Option(0,"string"),eventName:Option(0,"string"),args:Option(0,"json")}},_constructAudioNode:function(node){node=new XPCNativeWrapper(node);this._instrumentParams(node);let actor=new AudioNodeActor(this.conn,node);this.manage(actor);this._nativeToActorID.set(node.id,actor.actorID);return actor;},_instrumentParams:function(node){let type=getConstructorName(node);Object.keys(AUDIO_NODE_DEFINITION[type].properties||{}).filter(isAudioParam.bind(null,node)).forEach(paramName=>{let param=node[paramName];param._parentID=node.id;param._paramName=paramName;});},_getActorByNativeID:function(nativeID){
nativeID=~~nativeID;let actorID=this._nativeToActorID.get(nativeID);let actor=actorID!=null?this.conn.getActor(actorID):null;return actor;},_onStartContext:function(){systemOn("webaudio-node-demise",this._onDestroyNode);emit(this,"start-context");},_onConnectNode:function(source,dest){let sourceActor=this._getActorByNativeID(source.id);let destActor=this._getActorByNativeID(dest.id);emit(this,"connect-node",{source:sourceActor,dest:destActor});},_onConnectParam:function(source,param){let sourceActor=this._getActorByNativeID(source.id);let destActor=this._getActorByNativeID(param._parentID);emit(this,"connect-param",{source:sourceActor,dest:destActor,param:param._paramName});},_onDisconnectNode:function(node){let actor=this._getActorByNativeID(node.id);emit(this,"disconnect-node",actor);},_onParamChange:function(node,param,value){let actor=this._getActorByNativeID(node.id);emit(this,"param-change",{source:actor,param:param,value:value});},_onCreateNode:function(node){let actor=this._constructAudioNode(node);emit(this,"create-node",actor);},_onDestroyNode:function({data}){let nativeID=~~data;let actor=this._getActorByNativeID(nativeID);
if(actor){this._nativeToActorID.delete(nativeID);emit(this,"destroy-node",actor);}},_onGlobalCreated:function(){this._callWatcher.resumeRecording();},_onAutomationEvent:function({node,paramName,eventName,args}){emit(this,"automation-event",{node:node,paramName:paramName,eventName:eventName,args:args});},_onGlobalDestroyed:function({id}){if(this._callWatcher._tracedWindowId!==id){return;}
if(this._nativeToActorID){this._nativeToActorID.clear();}
systemOff("webaudio-node-demise",this._onDestroyNode);}});let WebAudioFront=exports.WebAudioFront=protocol.FrontClass(WebAudioActor,{initialize:function(client,{webaudioActor}){protocol.Front.prototype.initialize.call(this,client,{actor:webaudioActor});this.manage(this);}});WebAudioFront.AUTOMATION_METHODS=new Set(AUTOMATION_METHODS);WebAudioFront.NODE_CREATION_METHODS=new Set(NODE_CREATION_METHODS);WebAudioFront.NODE_ROUTING_METHODS=new Set(NODE_ROUTING_METHODS);function isAudioParam(node,prop){return!!(node[prop]&&/AudioParam/.test(node[prop].toString()));}
function constructError(err){return{message:err.message,type:err.constructor.name};}
function CollectedAudioNodeError(){return{message:"AudioNode has been garbage collected and can no longer be reached.",type:"UnreachableAudioNode"};}
function InvalidCommandError(){return{message:"The command on AudioNode is invalid.",type:"InvalidCommand"};}
function getConstructorName(obj){return obj.toString().match(/\[object ([^\[\]]*)\]\]?$/)[1];}
function createObjectGrip(value){return{type:"object",preview:{kind:"ObjectWithText",text:""},class:getConstructorName(value)};}
function sanitizeAutomationArgs(args){return args.reduce((newArgs,el)=>{newArgs.push(typeof el==="object"&&getConstructorName(el)==="Float32Array"?castToArray(el):el);return newArgs;},[]);}
function castToArray(typedArray){
let global=Cu.getGlobalForObject(this);let safeView=Cu.cloneInto(typedArray.subarray(),global);return copyInto([],safeView);}
function copyInto(dest,source){for(let i=0;i<source.length;i++){dest[i]=source[i];}
return dest;}