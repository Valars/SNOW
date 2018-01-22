var CIRelationshipsTools = Class.create();
CIRelationshipsTools.prototype = {
	_optionsTemplate:{
		/*Put your options templates here*/
	},
    initialize: function(cIId,options) {
		this.defaultMaxDepth = 1;
		this.ci = cIId;
		if(typeof options == "string" && this._optionsTemplate[options])
			this.options = this._optionsTemplate[options];
		else if(options instanceof Object)
			this.options = options;
		else 
			this.options = {};
		
		//check options validity
		if(!(this.options.authClass instanceof Array) || !this.options.authClass.length)
			delete this.options.authClass;
		if(!(this.options.prohClass instanceof Array) || !this.options.prohClass.length)
			delete this.options.prohClass;
		if(typeof this.options.encodedQuery != "string")
			delete this.options.encodedQuery;
		if(!(this.options.stopClass instanceof Array) || !this.options.stopClass.length)
			delete this.options.stopClass;
		if(typeof this.options.filterCI != "function")
			delete this.options.filterCI;
		if(typeof this.options.allCI != "string")
			delete this.options.allCI;
    },
	getRelatedCIFilter: function(maxDepth, childToParent){
		var relatedCIs = this.getRelatedCI(maxDepth, childToParent);
		return relatedCIs.length || !this.options.allCI?"sys_idIN"+relatedCIs:this.options.allCI;
	},
	getRelatedCI: function(maxDepth, childToParent){
		var counter = typeof maxDepth != "number" && maxDepth && maxDepth>0? maxDepth : this.defaultMaxDepth;
		var resultSet = {};
		this._getRelatedChildsCIReq(this.ci,childToParent,counter, resultSet);
		return Object.keys(resultSet);
	},
	_getRelatedChildsCIReq: function(cIId, direction, maxDepth, result){
		if(typeof cIId != "string" || cIId.length != 32)
			throw "cIId must be system id string (32 characters)";
		try{
		var fifo = [[cIId,0]];
		var curr; 
		var dir = [!direction?"parent":"child",direction?"parent":"child"]; 
		
		while(curr = fifo.shift()){
			var gr = new GlideRecord("cmdb_rel_ci");
				gr.addQuery(dir[0]+".sys_id",curr[0]);
				if(this.options.encodedQuery) 
					gr.addEncodedQuery(this.options.encodedQuery);
				gr.query();
			
			while(gr.next()){
				var related = gr[dir[1]];
				var sid = related.sys_id;
				var sysClassName = related.sys_class_name.toString();
				
				if(result[sid] !== undefined) continue; 
				
				var filterCI = this.options.filterCI?this.options.filterCI(related):[true,true];
				
				result[sid] = this._isResultValid(sysClassName)  && filterCI[0];
				
				if(curr[1]+1 < maxDepth && !this._isStopClass(sysClassName) && filterCI[1])
					fifo.push([sid,curr[1]+1]);
			}
		}
		var keys = Object.keys(result);
		for(var i=0,end=keys.length;i<end;i++)
			if(result[keys[i]] === false)
				delete result[keys[i]];
		}catch(e){gs.log(JSON.stringify(e,null,4),"CIRelationshipsTools");}
	},
	_isResultValid : function(sysClassName){	
		return this._isResultAuthClass(sysClassName) && 
			!this._isResultProhClass(sysClassName);
	},
	_isResultAuthClass: function(sysClassName){
		return !this.options.authClass ||
			this.options.authClass.indexOf(sysClassName) !=-1;
	},
	_isResultProhClass: function(sysClassName){
		return this.options.prohClass && 
			this.options.prohClass.indexOf(sysClassName) !=-1;
	},
	_isStopClass: function(sysClassName){
		return this.options.stopClass 
			&& this.options.stopClass.indexOf(sysClassName) != -1;
	},
    type: 'CIRelationshipsTools'
};