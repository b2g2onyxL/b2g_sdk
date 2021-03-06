
const{classes:Cc,interfaces:Ci,utils:Cu,results:Cr}=Components;Cu.import("resource://gre/modules/XPCOMUtils.jsm");Cu.import("resource://gre/modules/Services.jsm");XPCOMUtils.defineLazyModuleGetter(this,"Downloads","resource://gre/modules/Downloads.jsm");XPCOMUtils.defineLazyModuleGetter(this,"Task","resource://gre/modules/Task.jsm");

function HelperAppLauncherDialog(){}
HelperAppLauncherDialog.prototype={classID:Components.ID("{710322af-e6ae-4b0c-b2c9-1474a87b077e}"),QueryInterface:XPCOMUtils.generateQI([Ci.nsIHelperAppLauncherDialog]),show:function(aLauncher,aContext,aReason){aLauncher.MIMEInfo.preferredAction=Ci.nsIMIMEInfo.saveToDisk;aLauncher.saveToDisk(null,false);},promptForSaveToFileAsync:function(aLauncher,aContext,aDefaultFile,aSuggestedFileExt,aForcePrompt){Task.spawn(function(){let file=null;try{let defaultFolder=yield Downloads.getPreferredDownloadsDirectory();let dir=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);dir.initWithPath(defaultFolder);file=this.validateLeafName(dir,aDefaultFile,aSuggestedFileExt);}catch(e){}
aLauncher.saveDestinationAvailable(file);}.bind(this)).then(null,Cu.reportError);},validateLeafName:function(aLocalFile,aLeafName,aFileExt){if(!(aLocalFile&&this.isUsableDirectory(aLocalFile)))
return null;
aLeafName=aLeafName.replace(/^\.+/,"");if(aLeafName=="")
aLeafName="unnamed"+(aFileExt?"."+aFileExt:"");aLocalFile.append(aLeafName);this.makeFileUnique(aLocalFile);return aLocalFile;},makeFileUnique:function(aLocalFile){try{

let collisionCount=0;while(aLocalFile.exists()){collisionCount++;if(collisionCount==1){
 if(aLocalFile.leafName.match(/\.[^\.]{1,3}\.(gz|bz2|Z)$/i))
aLocalFile.leafName=aLocalFile.leafName.replace(/\.[^\.]{1,3}\.(gz|bz2|Z)$/i,"(2)$&");else
aLocalFile.leafName=aLocalFile.leafName.replace(/(\.[^\.]*)?$/,"(2)$&");}
else{aLocalFile.leafName=aLocalFile.leafName.replace(/^(.*\()\d+\)/,"$1"+(collisionCount+1)+")");}}
aLocalFile.create(Ci.nsIFile.NORMAL_FILE_TYPE,0600);}
catch(e){dump("*** exception in makeFileUnique: "+e+"\n");if(e.result==Cr.NS_ERROR_FILE_ACCESS_DENIED)
throw e;if(aLocalFile.leafName==""||aLocalFile.isDirectory()){aLocalFile.append("unnamed");if(aLocalFile.exists())
aLocalFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE,0600);}}},isUsableDirectory:function(aDirectory){return aDirectory.exists()&&aDirectory.isDirectory()&&aDirectory.isWritable();},};this.NSGetFactory=XPCOMUtils.generateNSGetFactory([HelperAppLauncherDialog]);