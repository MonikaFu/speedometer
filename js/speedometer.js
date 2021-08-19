var data = [{"technology": "Renewables", "disruption_score": 1}];
let svgHeight= 200, svgWidth = 500;

let container = 'div[id="fig_speedometer"]';

let container_div = document.querySelector(container);

let svg = d3.select(container_div)
	.append('svg')
	.attr('width', svgWidth)
    .attr('height', svgHeight);

svg.append('rect')
	.style('color', 'blue');
