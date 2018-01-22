var InterfaceTracking = Class.create();
InterfaceTracking.prototype = Object.extendsObject(AbstractAjaxProcessor, {
	logger : function(){
		return InterfaceTracking.logger(this.getParameter('sysparm_url'));
	},
    type: 'InterfaceTracking'
});
InterfaceTracking.logger = function(url){
	try{
	var parsedURL = InterfaceTracking.parseURL(url);
	var interfaceV = parsedURL[1];
	interfaceV = interfaceV.replace(/\//g,"");
	if(!interfaceV.length) interfaceV = "backend";
	var gr = new GlideRecord("u_portal_user_activity");
	gr.initialize();
	gr.u_user = gs.getUserID();
	gr.u_interface = interfaceV;
	gr.u_page = parsedURL.length==3? parsedURL[2]:"";
	gr.insert();
	return null;
	}catch(e){return JSON.stringify(e);}
};
InterfaceTracking.parseURL = function(url){
	var re = /^https:\/\/.*\..{1,3}(\/\w*\/|\/)(.+\.do.*$)?/g;
	return re.exec(url);
};