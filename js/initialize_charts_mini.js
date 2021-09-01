var imported;

//external libs 
imported = document.createElement("script"); imported.src = "js/d3.v4.min.js"; document.head.appendChild(imported);

// internal libs
imported = document.createElement("script"); imported.src = "js/speedometer.js"; document.head.appendChild(imported);

window.addEventListener('load', (event) => {
	var graph_id = "speedometer";
	var labels = {};
	var opts = {
		svgHeight: 150,
		svgWidth: 250
	};
	window[graph_id] = new speedometer("div[id='"+ graph_id +"']", data_speedometer, labels, opts);
});