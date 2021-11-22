var imported;

//external libs 
imported = document.createElement("script"); imported.src = "js/d3.v4.min.js"; document.head.appendChild(imported);

// internal libs
//imported = document.createElement("script"); imported.src = "js/speedometer.js"; document.head.appendChild(imported);
imported = document.createElement("script"); imported.src = "js/speedometer_dashboard.js"; document.head.appendChild(imported);

window.addEventListener('load', (event) => {
	/*
	var graph_id = "speedometer";
	var labels = {};
	var opts = {
		svgHeight: 150,
		svgWidth: 250
	};
	window[graph_id] = new speedometer("div[id='"+ graph_id +"']", data_speedometer, labels, opts);
	*/
	var graph_id = "speedometer_dashboard";
	var labels_dashboard = {};
	var opts_dashboard = {}
	window[graph_id] = new speedometer_dashboard("div[id='"+ graph_id +"']", data_tdm, labels_dashboard, opts_dashboard);
});