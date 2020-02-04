"use strict";this.EXPORTED_SYMBOLS=["AlarmDB"];const DEBUG=false;function debug(aStr){if(DEBUG)
dump("AlarmDB: "+aStr+"\n");}
const{classes:Cc,interfaces:Ci,utils:Cu,results:Cr}=Components;Cu.import("resource://gre/modules/Services.jsm");Cu.import("resource://gre/modules/IndexedDBHelper.jsm");const ALARMDB_NAME="alarms";const ALARMDB_VERSION=1;const ALARMSTORE_NAME="alarms";this.AlarmDB=function AlarmDB(){debug("AlarmDB()");}
AlarmDB.prototype={__proto__:IndexedDBHelper.prototype,init:function init(){debug("init()");this.initDBHelper(ALARMDB_NAME,ALARMDB_VERSION,[ALARMSTORE_NAME]);},upgradeSchema:function upgradeSchema(aTransaction,aDb,aOldVersion,aNewVersion){debug("upgradeSchema()");let objStore=aDb.createObjectStore(ALARMSTORE_NAME,{keyPath:"id",autoIncrement:true});objStore.createIndex("date","date",{unique:false});objStore.createIndex("ignoreTimezone","ignoreTimezone",{unique:false});objStore.createIndex("timezoneOffset","timezoneOffset",{unique:false});objStore.createIndex("data","data",{unique:false});objStore.createIndex("pageURL","pageURL",{unique:false});objStore.createIndex("manifestURL","manifestURL",{unique:false});debug("Created object stores and indexes");},add:function add(aAlarm,aSuccessCb,aErrorCb){debug("add()");this.newTxn("readwrite",ALARMSTORE_NAME,function txnCb(aTxn,aStore){debug("Going to add "+JSON.stringify(aAlarm));aStore.put(aAlarm).onsuccess=function setTxnResult(aEvent){aTxn.result=aEvent.target.result;debug("Request successful. New record ID: "+aTxn.result);};},aSuccessCb,aErrorCb);},remove:function remove(aId,aManifestURL,aSuccessCb,aErrorCb){debug("remove()");this.newTxn("readwrite",ALARMSTORE_NAME,function txnCb(aTxn,aStore){debug("Going to remove "+aId);
aStore.get(aId).onsuccess=function doRemove(aEvent){let alarm=aEvent.target.result;if(!alarm){debug("Alarm doesn't exist. No need to remove it.");return;}
if(aManifestURL&&aManifestURL!=alarm.manifestURL){debug("Cannot remove the alarm added by other apps.");return;}
aStore.delete(aId);};},aSuccessCb,aErrorCb);},getAll:function getAll(aManifestURL,aSuccessCb,aErrorCb){debug("getAll()");this.newTxn("readonly",ALARMSTORE_NAME,function txnCb(aTxn,aStore){if(!aTxn.result){aTxn.result=[];}
let index=aStore.index("manifestURL");index.mozGetAll(aManifestURL).onsuccess=function setTxnResult(aEvent){aTxn.result=aEvent.target.result;debug("Request successful. Record count: "+aTxn.result.length);};},aSuccessCb,aErrorCb);}};