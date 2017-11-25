var CIRelationshipsTools = Class.create();
CIRelationshipsTools.prototype = {
	/***
	cIId : Sys id du CI de départ
	options : Objet contenant le paramétrage
		authClass : Array des classes authorisées, si un CI n'est pas d'une classe autorisée, il ne sera pas integré au résultat mais la recherche se poursuit dans ces enfants
		prohClass : Array des classes interdites (si authClass définie, ce paramètre ne sera pas pris en compte), si un CI est d'une classe interdite, il ne sera pas integré au résultat de la recherche mais 
		perimeter : Array des périmetres autorisés
		filterCI : function de filtrage avancé sur les CIS trouvés:
			IN : GlideElement sur la table cmdb_ci
			OUT: Array :
				0 : Boolean : Si Vrai, intégrer le CI trouvé au résultat
				1 : Boolean : Si Vrai, continuer la recherche dans ses enfants
		encodedQuery : Filtre sur la relation sous forme d'encoded query, possibilité d'utiliser le dot walking. Contrairement aux trois premiers paramètres, si un ci dans l'arbre est rejeté par ce filtre, l'exploration des ses enfants ne sera pas effectuée et le CI ne sera pas integré au résultat. Ce filtre est appliqué sur le GlideRecord récupérant les relations d'un CI et non sur les résultats de cette requête contrairement à tous les autres.
		stopClass : Array de classes, si un CI est trouvé avec l'une de ces classes, on ne parcourera pas ses enfants mais le CI sera tout de même intégré au résultat
		allCI : filtre des CIs à renvoyer si aucun n'est trouvé
	***/
	_optionsTemplate:{
		incident:{ //Template for Field incident.cmdb_ci
			prohClass: ["cmdb_ci_service","service_offering"],
			stopClass: ["cmdb_ci_rack","cmdb_ci_netgear"],
			filterCI: function(curr){
				return [curr.u_active==true,true];
			},
			allCI: "u_active=true^sys_class_nameNOT INcmdb_ci_service,service_offering"
		},
		incidentPortalSAP:{ 
			prohClass: ["cmdb_ci_service","service_offering"],
			stopClass: ["cmdb_ci_rack","cmdb_ci_netgear"],
			filterCI: function(curr){
				return [curr.u_active==true,true];
			},
			allCI: "u_active=true^sys_class_nameNOT INcmdb_ci_service,service_offering^u_perimeter=SAP",
			perimeter: ["SAP"]
		},
		incidentPortalCloud:{ //Template for Field incident.cmdb_ci
			prohClass: ["cmdb_ci_service","service_offering"],
			stopClass: ["cmdb_ci_rack","cmdb_ci_netgear"],
			filterCI: function(curr){
				return [curr.u_active==true,true];
			},
			allCI: "u_active=true^sys_class_nameNOT INcmdb_ci_service,service_offering^u_perimeter=Cloud",
			perimeter: ["Cloud"]
		},
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
		if(!(this.options.perimeter instanceof Array) || !this.options.perimeter.length)
			delete this.options.perimeter;
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
		var counter = maxDepth && maxDepth>0 ? maxDepth : this.defaultMaxDepth;
		var resultSet = {};
		this._getRelatedChildsCIReq(this.ci,childToParent,counter, resultSet);
		return Object.keys(resultSet);
	},
	_getRelatedChildsCIReq: function(cIId, direction, maxDepth, result){
		try{
		//var log = ""; //Debug
		var fifo = [[cIId,0]];
		var curr; //Temporary variable to containce related ci in found relationship
		var dir = [!direction?"parent":"child",direction?"parent":"child"]; //Indicate the research direction in the relationships
		
		//Debug
		/*function add(nb){
			var res = "";
			for(var i=0; i<nb ; i++) res+="    ";
			return res;
		}*/
		
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
				
				if(result[sid] !== undefined) continue; //Déjà connu et sous-arbre parcouru
				
				var filterCI = this.options.filterCI?this.options.filterCI(related):[true,true];
				
				//log+=(add(curr[1]+1)+related.name +"      "+related.sys_class_name+"      "+gr[dir[0]].name+"\n"); //Debug
				result[sid] = this._isResultValid(sysClassName)  
					&& this._isResultInPerimeter(related.u_perimeter.toString()) 
					&& filterCI[0];
				
				if(curr[1]+1 < maxDepth && !this._isStopClass(sysClassName) && filterCI[1])
					fifo.push([sid,curr[1]+1]);
			}
		}
		//log += "\nResult : "+JSON.stringify(result,null,4); //Debug
		var keys = Object.keys(result);
		for(var i=0,end=keys.length;i<end;i++)
			if(result[keys[i]] === false)
				delete result[keys[i]];
		//gs.log(log,"CIRelationshipsTools"); //Debug
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
	_isResultInPerimeter: function(perimeter){
		return !this.options.perimeter ||
			this.options.perimeter.indexOf(perimeter) != -1;
	},
	_isStopClass: function(sysClassName){
		return this.options.stopClass 
			&& this.options.stopClass.indexOf(sysClassName) != -1;
	},
    type: 'CIRelationshipsTools'
};