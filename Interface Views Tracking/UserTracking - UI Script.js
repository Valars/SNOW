/*
UI Script Global
*/

{
	var ga = new GlideAjax("InterfaceTracking");
	ga.addParam("sysparm_name","logger");
	ga.addParam("sysparm_url",window.location.href);
	ga.getXML(function(){
		var res = ga.getAnswer();
		if(res)console.error(JSON.parse(res));
	});
}