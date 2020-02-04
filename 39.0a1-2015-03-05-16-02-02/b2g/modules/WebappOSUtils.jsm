const{classes:Cc,interfaces:Ci,results:Cr,utils:Cu,Constructor:CC}=Components;Cu.import("resource://gre/modules/Services.jsm");Cu.import("resource://gre/modules/FileUtils.jsm");Cu.import("resource://gre/modules/Promise.jsm");this.EXPORTED_SYMBOLS=["WebappOSUtils"];function computeHash(aString){let converter=Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);converter.charset="UTF-8";let result={};let data=converter.convertToByteArray(aString,result);let hasher=Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);hasher.init(hasher.MD5);hasher.update(data,data.length);let hash=hasher.finish(false);function toHexString(charCode){return("0"+charCode.toString(16)).slice(-2);}
return[toHexString(hash.charCodeAt(i))for(i in hash)].join("");}
this.WebappOSUtils={getUniqueName:function(aApp){return this.sanitizeStringForFilename(aApp.name).toLowerCase()+"-"+
computeHash(aApp.manifestURL);},getLaunchTarget:function(aApp){let uniqueName=this.getUniqueName(aApp);let exeFile=Services.dirsvc.get("Home",Ci.nsIFile);exeFile.append("."+uniqueName);exeFile.append("webapprt-stub"); if(!exeFile.exists()){exeFile=Services.dirsvc.get("Home",Ci.nsIFile);let origin=Services.io.newURI(aApp.origin,null,null);let installDir="."+origin.scheme+";"+
origin.host+
(origin.port!=-1?";"+origin.port:"");exeFile.append(installDir);exeFile.append("webapprt-stub");if(!exeFile.exists()||!this.isOldInstallPathValid(aApp,exeFile.parent.path)){return null;}}
return exeFile;},getInstallPath:function(aApp){ return aApp.basePath+"/"+aApp.id; throw new Error("Unsupported apps platform");},getPackagePath:function(aApp){let packagePath=this.getInstallPath(aApp);
return packagePath;},launch:function(aApp){let uniqueName=this.getUniqueName(aApp);let exeFile=this.getLaunchTarget(aApp);if(!exeFile){return false;}
try{let process=Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);process.init(exeFile);process.runAsync([],0);}catch(e){return false;}
return true;},uninstall:function(aApp){let exeFile=this.getLaunchTarget(aApp);if(!exeFile){return Promise.reject("App executable file not found");}
let deferred=Promise.defer();try{let process=Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);process.init(exeFile);process.runAsync(["-remove"],1,(aSubject,aTopic)=>{if(aTopic=="process-finished"){deferred.resolve(true);}else{deferred.reject("Uninstaller failed with exit code: "+aSubject.exitValue);}});}catch(e){deferred.reject(e);}
return deferred.promise;},isOldInstallPathValid:function(aApp,aInstallPath){

if(aApp.origin.startsWith("app")){return false;}

return true;},isLaunchable:function(aApp){let uniqueName=this.getUniqueName(aApp);let env=Cc["@mozilla.org/process/environment;1"].getService(Ci.nsIEnvironment);let xdg_data_home_env;try{xdg_data_home_env=env.get("XDG_DATA_HOME");}catch(ex){}
let desktopINI;if(xdg_data_home_env){desktopINI=new FileUtils.File(xdg_data_home_env);}else{desktopINI=FileUtils.getFile("Home",[".local","share"]);}
desktopINI.append("applications");desktopINI.append("owa-"+uniqueName+".desktop"); if(!desktopINI.exists()){if(xdg_data_home_env){desktopINI=new FileUtils.File(xdg_data_home_env);}else{desktopINI=FileUtils.getFile("Home",[".local","share"]);}
let origin=Services.io.newURI(aApp.origin,null,null);let oldUniqueName=origin.scheme+";"+
origin.host+
(origin.port!=-1?";"+origin.port:"");desktopINI.append("owa-"+oldUniqueName+".desktop");if(!desktopINI.exists()){return false;}
let installDir=Services.dirsvc.get("Home",Ci.nsIFile);installDir.append("."+origin.scheme+";"+origin.host+
(origin.port!=-1?";"+origin.port:""));return isOldInstallPathValid(aApp,installDir.path);}
return true;},sanitizeStringForFilename:function(aPossiblyBadFilenameString){return aPossiblyBadFilenameString.replace(/[^a-z0-9_\-]/gi,"");}}