'use strict';const{merge}=require('../util/object');const{Class}=require('../core/heritage');const{EventTarget}=require('../event/target');const{getInnerId,getByInnerId}=require('../window/utils');const{instanceOf,isObject}=require('../lang/type');const{on:observe}=require('../system/events');const{WorkerSandbox}=require('./sandbox');const{Ci}=require('chrome');const EVENTS={'chrome-page-shown':'pageshow','content-page-shown':'pageshow','chrome-page-hidden':'pagehide','content-page-hidden':'pagehide','inner-window-destroyed':'detach',}
const WorkerChild=Class({implements:[EventTarget],initialize(options){merge(this,options);this.port=EventTarget();this.port.on('*',this.send.bind(this,'event'));this.on('*',this.send.bind(this));this.observe=this.observe.bind(this);for(let topic in EVENTS)
observe(topic,this.observe);this.receive=this.receive.bind(this);this.manager.addMessageListener('sdk/worker/message',this.receive);let window=getByInnerId(this.window);this.sandbox=WorkerSandbox(this,window);if(options.currentReadyState!="complete"&&window.document.readyState=="complete"){

this.sandbox.emitSync("pageshow");this.send("pageshow");}}, receive({data:{id,args}}){if(id!==this.id)
return;this.sandbox.emit(...args);if(args[0]==='detach')
this.destroy(args[1]);},send(...args){args=JSON.parse(JSON.stringify(args,exceptions));if(this.manager.content)
this.manager.sendAsyncMessage('sdk/worker/event',{id:this.id,args});}, observe({type,subject}){if(!this.sandbox)
return;if(subject.defaultView&&getInnerId(subject.defaultView)===this.window){this.sandbox.emitSync(EVENTS[type]);this.send(EVENTS[type]);}
if(type==='inner-window-destroyed'&&subject.QueryInterface(Ci.nsISupportsPRUint64).data===this.window){this.destroy();}}, destroy(reason){if(!this.sandbox)
return;if(this.manager.content)
this.manager.removeMessageListener('sdk/worker/message',this.receive);this.sandbox.destroy(reason);this.sandbox=null;this.send('detach');}})
exports.WorkerChild=WorkerChild;function exceptions(key,value){if(!isObject(value)||!instanceOf(value,Error))
return value;let _errorType=value.constructor.name;let{message,fileName,lineNumber,stack,name}=value;return{_errorType,message,fileName,lineNumber,stack,name};}