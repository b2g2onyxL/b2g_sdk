







let EXPORTED_SYMBOLS=["ContentPrefService2",];const{interfaces:Ci,classes:Cc,results:Cr,utils:Cu}=Components;Cu.import("resource://gre/modules/Services.jsm");Cu.import("resource://gre/modules/ContentPrefUtils.jsm");Cu.import("resource://gre/modules/ContentPrefStore.jsm");const GROUP_CLAUSE=`
  SELECT id
  FROM groups
  WHERE name = :group OR
        (:includeSubdomains AND name LIKE :pattern ESCAPE '/')
`;function ContentPrefService2(cps){this._cps=cps;this._cache=cps._cache;this._pbStore=cps._privModeStorage;}
ContentPrefService2.prototype={getByName:function CPS2_getByName(name,context,callback){checkNameArg(name);checkCallbackArg(callback,true);
let pbPrefs=new ContentPrefStore();if(context&&context.usePrivateBrowsing){for(let[sgroup,sname,val]of this._pbStore){if(sname==name){pbPrefs.set(sgroup,sname,val);}}}
let stmt1=this._stmt(`
      SELECT groups.name AS grp, prefs.value AS value
      FROM prefs
      JOIN settings ON settings.id = prefs.settingID
      JOIN groups ON groups.id = prefs.groupID
      WHERE settings.name = :name
    `);stmt1.params.name=name;let stmt2=this._stmt(`
      SELECT NULL AS grp, prefs.value AS value
      FROM prefs
      JOIN settings ON settings.id = prefs.settingID
      WHERE settings.name = :name AND prefs.groupID ISNULL
    `);stmt2.params.name=name;this._execStmts([stmt1,stmt2],{onRow:function onRow(row){let grp=row.getResultByName("grp");let val=row.getResultByName("value");this._cache.set(grp,name,val);if(!pbPrefs.has(grp,name))
cbHandleResult(callback,new ContentPref(grp,name,val));},onDone:function onDone(reason,ok,gotRow){if(ok){for(let[pbGroup,pbName,pbVal]of pbPrefs){cbHandleResult(callback,new ContentPref(pbGroup,pbName,pbVal));}}
cbHandleCompletion(callback,reason);},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},getByDomainAndName:function CPS2_getByDomainAndName(group,name,context,callback){checkGroupArg(group);this._get(group,name,false,context,callback);},getBySubdomainAndName:function CPS2_getBySubdomainAndName(group,name,context,callback){checkGroupArg(group);this._get(group,name,true,context,callback);},getGlobal:function CPS2_getGlobal(name,context,callback){this._get(null,name,false,context,callback);},_get:function CPS2__get(group,name,includeSubdomains,context,callback){group=this._parseGroup(group);checkNameArg(name);checkCallbackArg(callback,true);
let pbPrefs=new ContentPrefStore();if(context&&context.usePrivateBrowsing){for(let[sgroup,val]of
this._pbStore.match(group,name,includeSubdomains)){pbPrefs.set(sgroup,name,val);}}
this._execStmts([this._commonGetStmt(group,name,includeSubdomains)],{onRow:function onRow(row){let grp=row.getResultByName("grp");let val=row.getResultByName("value");this._cache.set(grp,name,val);if(!pbPrefs.has(group,name))
cbHandleResult(callback,new ContentPref(grp,name,val));},onDone:function onDone(reason,ok,gotRow){if(ok){if(!gotRow)
this._cache.set(group,name,undefined);for(let[pbGroup,pbName,pbVal]of pbPrefs){cbHandleResult(callback,new ContentPref(pbGroup,pbName,pbVal));}}
cbHandleCompletion(callback,reason);},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},_commonGetStmt:function CPS2__commonGetStmt(group,name,includeSubdomains){let stmt=group?this._stmtWithGroupClause(group,includeSubdomains,`
        SELECT groups.name AS grp, prefs.value AS value
        FROM prefs
        JOIN settings ON settings.id = prefs.settingID
        JOIN groups ON groups.id = prefs.groupID
        WHERE settings.name = :name AND prefs.groupID IN (${GROUP_CLAUSE})
      `):this._stmt(`
        SELECT NULL AS grp, prefs.value AS value
        FROM prefs
        JOIN settings ON settings.id = prefs.settingID
        WHERE settings.name = :name AND prefs.groupID ISNULL
      `);stmt.params.name=name;return stmt;},_stmtWithGroupClause:function CPS2__stmtWithGroupClause(group,includeSubdomains,sql){let stmt=this._stmt(sql);stmt.params.group=group;stmt.params.includeSubdomains=includeSubdomains||false;stmt.params.pattern="%."+stmt.escapeStringForLIKE(group,"/");return stmt;},getCachedByDomainAndName:function CPS2_getCachedByDomainAndName(group,name,context){checkGroupArg(group);let prefs=this._getCached(group,name,false,context);return prefs[0]||null;},getCachedBySubdomainAndName:function CPS2_getCachedBySubdomainAndName(group,name,context,len){checkGroupArg(group);let prefs=this._getCached(group,name,true,context);if(len)
len.value=prefs.length;return prefs;},getCachedGlobal:function CPS2_getCachedGlobal(name,context){let prefs=this._getCached(null,name,false,context);return prefs[0]||null;},_getCached:function CPS2__getCached(group,name,includeSubdomains,context){group=this._parseGroup(group);checkNameArg(name);let storesToCheck=[this._cache];if(context&&context.usePrivateBrowsing)
storesToCheck.push(this._pbStore);let outStore=new ContentPrefStore();storesToCheck.forEach(function(store){for(let[sgroup,val]of store.match(group,name,includeSubdomains)){outStore.set(sgroup,name,val);}});let prefs=[];for(let[sgroup,sname,val]of outStore){prefs.push(new ContentPref(sgroup,sname,val));}
return prefs;},set:function CPS2_set(group,name,value,context,callback){checkGroupArg(group);this._set(group,name,value,context,callback);},setGlobal:function CPS2_setGlobal(name,value,context,callback){this._set(null,name,value,context,callback);},_set:function CPS2__set(group,name,value,context,callback){group=this._parseGroup(group);checkNameArg(name);checkValueArg(value);checkCallbackArg(callback,false);if(context&&context.usePrivateBrowsing){this._pbStore.set(group,name,value);this._schedule(function(){cbHandleCompletion(callback,Ci.nsIContentPrefCallback2.COMPLETE_OK);this._cps._notifyPrefSet(group,name,value);});return;}

this._cache.remove(group,name);let stmts=[];let stmt=this._stmt(`
      INSERT OR IGNORE INTO settings (id, name)
      VALUES((SELECT id FROM settings WHERE name = :name), :name)
    `);stmt.params.name=name;stmts.push(stmt);if(group){stmt=this._stmt(`
        INSERT OR IGNORE INTO groups (id, name)
        VALUES((SELECT id FROM groups WHERE name = :group), :group)
      `);stmt.params.group=group;stmts.push(stmt);}
if(group){stmt=this._stmt(`
        INSERT OR REPLACE INTO prefs (id, groupID, settingID, value, timestamp)
        VALUES(
          (SELECT prefs.id
           FROM prefs
           JOIN groups ON groups.id = prefs.groupID
           JOIN settings ON settings.id = prefs.settingID
           WHERE groups.name = :group AND settings.name = :name),
          (SELECT id FROM groups WHERE name = :group),
          (SELECT id FROM settings WHERE name = :name),
          :value,
          :now
        )
      `);stmt.params.group=group;}
else{stmt=this._stmt(`
        INSERT OR REPLACE INTO prefs (id, groupID, settingID, value, timestamp)
        VALUES(
          (SELECT prefs.id
           FROM prefs
           JOIN settings ON settings.id = prefs.settingID
           WHERE prefs.groupID IS NULL AND settings.name = :name),
          NULL,
          (SELECT id FROM settings WHERE name = :name),
          :value,
          :now
        )
      `);}
stmt.params.name=name;stmt.params.value=value;stmt.params.now=Date.now()/1000;stmts.push(stmt);this._execStmts(stmts,{onDone:function onDone(reason,ok){if(ok)
this._cache.setWithCast(group,name,value);cbHandleCompletion(callback,reason);if(ok)
this._cps._notifyPrefSet(group,name,value);},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},removeByDomainAndName:function CPS2_removeByDomainAndName(group,name,context,callback){checkGroupArg(group);this._remove(group,name,false,context,callback);},removeBySubdomainAndName:function CPS2_removeBySubdomainAndName(group,name,context,callback){checkGroupArg(group);this._remove(group,name,true,context,callback);},removeGlobal:function CPS2_removeGlobal(name,context,callback){this._remove(null,name,false,context,callback);},_remove:function CPS2__remove(group,name,includeSubdomains,context,callback){group=this._parseGroup(group);checkNameArg(name);checkCallbackArg(callback,false);
for(let sgroup of this._cache.matchGroups(group,includeSubdomains)){this._cache.remove(sgroup,name);}
let stmts=[];stmts.push(this._commonGetStmt(group,name,includeSubdomains));let stmt=this._stmtWithGroupClause(group,includeSubdomains,`
      DELETE FROM prefs
      WHERE settingID = (SELECT id FROM settings WHERE name = :name) AND
            CASE typeof(:group)
            WHEN 'null' THEN prefs.groupID IS NULL
            ELSE prefs.groupID IN (${GROUP_CLAUSE})
            END
    `);stmt.params.name=name;stmts.push(stmt);stmts=stmts.concat(this._settingsAndGroupsCleanupStmts());let prefs=new ContentPrefStore();this._execStmts(stmts,{onRow:function onRow(row){let grp=row.getResultByName("grp");prefs.set(grp,name,undefined);this._cache.set(grp,name,undefined);},onDone:function onDone(reason,ok){if(ok){this._cache.set(group,name,undefined);if(context&&context.usePrivateBrowsing){for(let[sgroup,]of
this._pbStore.match(group,name,includeSubdomains)){prefs.set(sgroup,name,undefined);this._pbStore.remove(sgroup,name);}}}
cbHandleCompletion(callback,reason);if(ok){for(let[sgroup,,]of prefs){this._cps._notifyPrefRemoved(sgroup,name);}}},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},_settingsAndGroupsCleanupStmts:function(){
return[this._stmt(`
        DELETE FROM settings
        WHERE id NOT IN (SELECT DISTINCT settingID FROM prefs)
      `),this._stmt(`
        DELETE FROM groups WHERE id NOT IN (
          SELECT DISTINCT groupID FROM prefs WHERE groupID NOTNULL
        )
      `)];},removeByDomain:function CPS2_removeByDomain(group,context,callback){checkGroupArg(group);this._removeByDomain(group,false,context,callback);},removeBySubdomain:function CPS2_removeBySubdomain(group,context,callback){checkGroupArg(group);this._removeByDomain(group,true,context,callback);},removeAllGlobals:function CPS2_removeAllGlobals(context,callback){this._removeByDomain(null,false,context,callback);},_removeByDomain:function CPS2__removeByDomain(group,includeSubdomains,context,callback){group=this._parseGroup(group);checkCallbackArg(callback,false);
for(let sgroup of this._cache.matchGroups(group,includeSubdomains)){this._cache.removeGroup(sgroup);}
let stmts=[];
if(group){stmts.push(this._stmtWithGroupClause(group,includeSubdomains,`
        SELECT groups.name AS grp, settings.name AS name
        FROM prefs
        JOIN settings ON settings.id = prefs.settingID
        JOIN groups ON groups.id = prefs.groupID
        WHERE prefs.groupID IN (${GROUP_CLAUSE})
      `));stmts.push(this._stmtWithGroupClause(group,includeSubdomains,`DELETE FROM groups WHERE id IN (${GROUP_CLAUSE})`));stmts.push(this._stmt(`
        DELETE FROM prefs
        WHERE groupID NOTNULL AND groupID NOT IN (SELECT id FROM groups)
      `));}
else{stmts.push(this._stmt(`
        SELECT NULL AS grp, settings.name AS name
        FROM prefs
        JOIN settings ON settings.id = prefs.settingID
        WHERE prefs.groupID IS NULL
      `));stmts.push(this._stmt("DELETE FROM prefs WHERE groupID IS NULL"));}
stmts.push(this._stmt(`
      DELETE FROM settings
      WHERE id NOT IN (SELECT DISTINCT settingID FROM prefs)
    `));let prefs=new ContentPrefStore();this._execStmts(stmts,{onRow:function onRow(row){let grp=row.getResultByName("grp");let name=row.getResultByName("name");prefs.set(grp,name,undefined);this._cache.set(grp,name,undefined);},onDone:function onDone(reason,ok){if(ok&&context&&context.usePrivateBrowsing){for(let[sgroup,sname,]of this._pbStore){prefs.set(sgroup,sname,undefined);this._pbStore.remove(sgroup,sname);}}
cbHandleCompletion(callback,reason);if(ok){for(let[sgroup,sname,]of prefs){this._cps._notifyPrefRemoved(sgroup,sname);}}},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},_removeAllDomainsSince:function CPS2__removeAllDomainsSince(since,context,callback){checkCallbackArg(callback,false);since/=1000;
this._cache.removeAllGroups();let stmts=[];let stmt=this._stmt(`
      SELECT groups.name AS grp, settings.name AS name
      FROM prefs
      JOIN settings ON settings.id = prefs.settingID
      JOIN groups ON groups.id = prefs.groupID
      WHERE timestamp >= :since
    `);stmt.params.since=since;stmts.push(stmt);stmt=this._stmt(`
      DELETE FROM prefs WHERE groupID NOTNULL AND timestamp >= :since
    `);stmt.params.since=since;stmts.push(stmt);stmts=stmts.concat(this._settingsAndGroupsCleanupStmts());let prefs=new ContentPrefStore();this._execStmts(stmts,{onRow:function onRow(row){let grp=row.getResultByName("grp");let name=row.getResultByName("name");prefs.set(grp,name,undefined);this._cache.set(grp,name,undefined);},onDone:function onDone(reason,ok){
if(ok&&context&&context.usePrivateBrowsing){for(let[sgroup,sname,]of this._pbStore){prefs.set(sgroup,sname,undefined);}
this._pbStore.removeAllGroups();}
cbHandleCompletion(callback,reason);if(ok){for(let[sgroup,sname,]of prefs){this._cps._notifyPrefRemoved(sgroup,sname);}}},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},removeAllDomainsSince:function CPS2_removeAllDomainsSince(since,context,callback){this._removeAllDomainsSince(since,context,callback);},removeAllDomains:function CPS2_removeAllDomains(context,callback){this._removeAllDomainsSince(0,context,callback);},removeByName:function CPS2_removeByName(name,context,callback){checkNameArg(name);checkCallbackArg(callback,false);
for(let[group,sname,]of this._cache){if(sname==name)
this._cache.remove(group,name);}
let stmts=[];
let stmt=this._stmt(`
      SELECT groups.name AS grp
      FROM prefs
      JOIN settings ON settings.id = prefs.settingID
      JOIN groups ON groups.id = prefs.groupID
      WHERE settings.name = :name
      UNION
      SELECT NULL AS grp
      WHERE EXISTS (
        SELECT prefs.id
        FROM prefs
        JOIN settings ON settings.id = prefs.settingID
        WHERE settings.name = :name AND prefs.groupID IS NULL
      )
    `);stmt.params.name=name;stmts.push(stmt);stmt=this._stmt("DELETE FROM settings WHERE name = :name");stmt.params.name=name;stmts.push(stmt);stmts.push(this._stmt("DELETE FROM prefs WHERE settingID NOT IN (SELECT id FROM settings)"));stmts.push(this._stmt(`
      DELETE FROM groups WHERE id NOT IN (
        SELECT DISTINCT groupID FROM prefs WHERE groupID NOTNULL
      )
    `));let prefs=new ContentPrefStore();this._execStmts(stmts,{onRow:function onRow(row){let grp=row.getResultByName("grp");prefs.set(grp,name,undefined);this._cache.set(grp,name,undefined);},onDone:function onDone(reason,ok){if(ok&&context&&context.usePrivateBrowsing){for(let[sgroup,sname,]of this._pbStore){if(sname===name){prefs.set(sgroup,name,undefined);this._pbStore.remove(sgroup,name);}}}
cbHandleCompletion(callback,reason);if(ok){for(let[sgroup,,]of prefs){this._cps._notifyPrefRemoved(sgroup,name);}}},onError:function onError(nsresult){cbHandleError(callback,nsresult);}});},destroy:function CPS2_destroy(){if(this._statements){for each(let stmt in this._statements){stmt.finalize();}}},_stmt:function CPS2__stmt(sql){if(!this._statements)
this._statements={};if(!this._statements[sql])
this._statements[sql]=this._cps._dbConnection.createAsyncStatement(sql);return this._statements[sql];},_execStmts:function CPS2__execStmts(stmts,callbacks){let self=this;let gotRow=false;this._cps._dbConnection.executeAsync(stmts,stmts.length,{handleResult:function handleResult(results){try{let row=null;while((row=results.getNextRow())){gotRow=true;if(callbacks.onRow)
callbacks.onRow.call(self,row);}}
catch(err){Cu.reportError(err);}},handleCompletion:function handleCompletion(reason){try{let ok=reason==Ci.mozIStorageStatementCallback.REASON_FINISHED;callbacks.onDone.call(self,ok?Ci.nsIContentPrefCallback2.COMPLETE_OK:Ci.nsIContentPrefCallback2.COMPLETE_ERROR,ok,gotRow);}
catch(err){Cu.reportError(err);}},handleError:function handleError(error){try{if(callbacks.onError)
callbacks.onError.call(self,Cr.NS_ERROR_FAILURE);}
catch(err){Cu.reportError(err);}}});},_parseGroup:function CPS2__parseGroup(groupStr){if(!groupStr)
return null;try{var groupURI=Services.io.newURI(groupStr,null,null);}
catch(err){return groupStr;}
return this._cps._grouper.group(groupURI);},_schedule:function CPS2__schedule(fn){Services.tm.mainThread.dispatch(fn.bind(this),Ci.nsIThread.DISPATCH_NORMAL);},addObserverForName:function CPS2_addObserverForName(name,observer){this._cps._addObserver(name,observer);},removeObserverForName:function CPS2_removeObserverForName(name,observer){this._cps._removeObserver(name,observer);},extractDomain:function CPS2_extractDomain(str){return this._parseGroup(str);},observe:function CPS2_observe(subj,topic,data){switch(topic){case"test:reset":let fn=subj.QueryInterface(Ci.xpcIJSWeakReference).get();this._reset(fn);break;case"test:db":let obj=subj.QueryInterface(Ci.xpcIJSWeakReference).get();obj.value=this._cps._dbConnection;break;}},_reset:function CPS2__reset(callback){this._pbStore.removeAll();this._cache.removeAll();let cps=this._cps;cps._observers={};cps._genericObservers=[];let tables=["prefs","groups","settings"];let stmts=tables.map(function(t)this._stmt(`DELETE FROM ${t}`),this);this._execStmts(stmts,{onDone:function()callback()});},QueryInterface:function CPS2_QueryInterface(iid){let supportedIIDs=[Ci.nsIContentPrefService2,Ci.nsIObserver,Ci.nsISupports,];if(supportedIIDs.some(function(i)iid.equals(i)))
return this;if(iid.equals(Ci.nsIContentPrefService))
return this._cps;throw Cr.NS_ERROR_NO_INTERFACE;},};function checkGroupArg(group){if(!group||typeof(group)!="string")
throw invalidArg("domain must be nonempty string.");}
function checkNameArg(name){if(!name||typeof(name)!="string")
throw invalidArg("name must be nonempty string.");}
function checkValueArg(value){if(value===undefined)
throw invalidArg("value must not be undefined.");}
function checkCallbackArg(callback,required){if(callback&&!(callback instanceof Ci.nsIContentPrefCallback2))
throw invalidArg("callback must be an nsIContentPrefCallback2.");if(!callback&&required)
throw invalidArg("callback must be given.");}
function invalidArg(msg){return Components.Exception(msg,Cr.NS_ERROR_INVALID_ARG);}