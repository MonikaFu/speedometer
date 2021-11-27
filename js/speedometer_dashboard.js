class speedometer_dashboard {
	
	constructor(container, data, labels_dashboard, opts) {
		let container_div;
	    if (typeof container === 'string') {
	      container_div = document.querySelector(container);
	    } else {
	      container_div = container;
	    }

	    d3.select(container_div).attr('chart_type', 'speedometer');
		d3.select(container_div).attr('chart_type_data_download', 'speedometer'); //matching the names in the export/ folder

		container_div.classList.add('d3chart');
		container_div.classList.add('speedometer_chart');
		container_div.classList.add('chart_container');

		let chart_div = document.createElement('div');
    	chart_div.classList.add('chart_div');
    	container_div.insertBefore(chart_div, container_div.firstChild);
    
    	this.container = d3.select(chart_div);

		opts = (typeof opts === 'undefined') ? {} : opts;
    
    	let asset_class = (typeof opts.default_class === 'undefined') ? 'Listed Equity' : opts.default_class;
    	data = data.filter(d => d.asset_class == asset_class);

    	let sector = (typeof opts.default_sector === 'undefined') ? 'Automotive' : opts.default_sector;
    	let portfolio_name = data[0].portfolio_name // TODO: benchmark/no benchmark to be implemented then portfolio_name is not needed

    	labels_dashboard = (typeof labels_dashboard === 'undefined') ? {} : labels_dashboard;

    	let title = (typeof labels_dashboard.title === 'undefined') ? ': Transition Disruption Metric' : labels_dashboard.title;

    	let width = 700,
    	height = 600,
    	margin = {top: 40, bottom: 40, left: 40, right: 40},
    	chart_width = width - margin.left - margin.right,
    	chart_height = height - margin.top - margin.bottom;

    	const main_speed_height = Math.floor(chart_height/ 3) + margin.top,
    	main_speed_width = Math.floor(chart_width / 2),
    	small_speed_height = Math.floor(chart_height / 4),
    	small_speed_width = Math.floor(chart_width / 4);

    	// create title with selectors
	    let titlediv = document.createElement("div");
	    titlediv.style.width = width + "px";
	    titlediv.classList = "chart_title";
	    let title_p = document.createElement("p");
	    let bold_elt = document.createElement("b");
	    //strong_class.classList = "boldText";
	    bold_elt.appendChild(document.createTextNode(asset_class));
	    title_p.appendChild(bold_elt);
	    //let strong_class = ;
	    //strong_class.classList = "boldText";
	    title_p.appendChild(document.createTextNode(title));
	    titlediv.appendChild(title_p);
	    chart_div.appendChild(titlediv);

	    // sector selector
    	let sector_selector = document.createElement("select");
    	sector_selector.classList = "speedometer_dashboard_sector_selector inline_text_dropdown";
    	sector_selector.addEventListener("change", change_sector);

    	// create sector filter
    	let filterdiv = document.createElement("div");
    	filterdiv.style.width = width + "px";
    	filterdiv.classList = "chart_filters";
    	filterdiv.appendChild(document.createTextNode('Technology results for '));
    	filterdiv.appendChild(sector_selector);
    	filterdiv.appendChild(document.createTextNode(' sector.'));

    	let port_dial_div = this.container
    			.append('div')
    			.attr('class', 'portfolio_dial main_dial')
    			.style('width', width + 'px');

		function insertGauge(container, div_class, data, width, height, sector, technology, portfolio_name, benchmark_name, chart_title) {
			let div = container.select('.' + div_class);
			let config_gauge = {
				size: width - (width / 10),
				clipWidth: width,
				clipHeight: height,
				ringWidth: (3/20) * width,
				pointerWidth: 0.05 * width,
				pointerTailLength: (0.05 * width) / 2,
				marginTop: margin.top * 0.75,
				minValue: 0,
				maxValue: 6,
				majorTicks: 6,
				transitionMs: 100,
				labelFormat: function(d) { return d < 6 ? d3.format('d')(d) : '6+';},
				arcColorFn: colourWheel,
				title: chart_title
			};
			if (div_class == 'portfolio_dial') {
				config_gauge.annotate = true;
				config_gauge.marginTop = margin.top;
				config_gauge.marginSides = (700 - width) / 2;
			}
			var powerGauge = gauge(div, config_gauge);
			powerGauge.render();

			function updateReadings(data, whichReading, portfolioName, sector, technology) {
				let subdata = data.filter(d => d.ald_sector == sector);
				subdata = subdata.filter(d => d.technology == technology);
				subdata = subdata.filter(d => d.portfolio_name == portfolioName);
				subdata = subdata.filter(d => d.tdm_metric == whichReading);

				if (whichReading === 'portfolio') {
					powerGauge.update_portfolio(subdata[0].tdm_value);
				} else if (whichReading === 'scenario') {
					powerGauge.update_scenario_line(subdata[0].tdm_value);
				} else if (whichReading === 'benchmark') {
					powerGauge.update_benchmark(subdata[0].tdm_value);
				}
			}
				
			updateReadings(data, 'portfolio', portfolio_name, sector, technology);
			updateReadings(data, 'scenario', portfolio_name, sector, technology);
			//updateReadings(data, 'benchmark', "benchmark", "Corporate Bonds", "Aggregated", "Aggregated");
		}

		insertGauge(this.container, 'portfolio_dial', data, main_speed_width, main_speed_height, 'Aggregate', 'Aggregate', portfolio_name, null, 'Portfolio result');
		
		chart_div.appendChild(filterdiv);
		
		let selected_sector = sector;
      	sector_selector.length = 0;
      	let sector_names = d3.map(data.filter(d => d.ald_sector != 'Aggregate'), d => d.ald_sector).keys();
      	sector_names.forEach(sector_name => sector_selector.add(new Option(sector_name, sector_name)));
      	sector_selector.options[Math.max(0, sector_names.indexOf(selected_sector))].selected = 'selected';
      	//resize_inline_text_dropdown(null, sector_selector);

      	// run it
    	sector_selector.dispatchEvent(new Event('change'));

    	function createSmallDialDivs(container, div_id) {
    		let dial_div = container
    			.append('div')
    			.attr('class', div_id)
    			.style('width', small_speed_width + 'px')
    			.style('display', 'inline')
    	}

		function change_sector() {
			if (chart_div.contains(chart_div.querySelector("div[class^=tech]"))) {
      	  		chart_div.querySelectorAll("div[class^=tech]").forEach(e => e.remove());
      		}

			let selected_sector = sector_selector.value;

			let unique_technologies = d3.map(data.filter(d => d.ald_sector == selected_sector), d => d.technology).keys();
    		let n_tech = unique_technologies.length;

    		for (let i = 1; i <= n_tech; i++) {
			  createSmallDialDivs(d3.select(chart_div), 'tech' + i + '_dial', unique_technologies[i - 1]);
			}

			for (let i = 1; i <= n_tech; i++) {
			  insertGauge(d3.select(chart_div), 'tech' + i + '_dial', data, small_speed_width, small_speed_height, selected_sector, unique_technologies[i - 1], portfolio_name, null, unique_technologies[i - 1]);
			}
		};

	}
}

var gauge = function(container, configuration) {
	var that = {};
	var config = {
		size						: 400,
		clipWidth					: 200,
		clipHeight					: 110,
		ringInset					: 20,
		ringWidth					: 20,
		marginTop 					: 0, 
		marginSides 				: 0,
		
		pointerWidth				: 10,
		pointerTailLength			: 5,
		pointerHeadLengthPercent	: 0.9,
		
		minValue					: 0,
		maxValue					: 100,
		
		minAngle					: -90,
		maxAngle					: 90,
		
		transitionMs				: 750,
		
		majorTicks					: 5,
		labelFormat					: d3.format('d'),
		labelInset					: 10,
		labelAngleOffset			: -2,

		annotate 					: false,
		annotationOffsetScen 		: 5,
		annotationOffsetValues 		: 30,

		scenLabel 					: 'FSP',
		
		arcColorFn					: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#3e6c0a')),
		title 						: null
	};
	var range = undefined;
	var r = undefined;
	var pointerHeadLength = undefined;
	var value = 0;
	
	var svg = undefined;
	var arc = undefined;
	var scale = undefined;
	var ticks = undefined;
	var tickData = undefined;
	var pointer = undefined;

	var donut = d3.pie();
	
	function deg2rad(deg) {
		return deg * Math.PI / 180;
	}

	function point_coord(angle, radius) {
		angle = deg2rad(angle);
    	return [radius * Math.sin(angle), radius * Math.cos(angle) * -1];
	};
	
	function newAngle(d) {
		var ratio = scale(d);
		var newAngle = config.minAngle + (ratio * range);
		return newAngle;
	}
	
	function configure(configuration) {
		var prop = undefined;
		for ( prop in configuration ) {
			config[prop] = configuration[prop];
		}
		
		range = config.maxAngle - config.minAngle;
		r = config.size / 2;
		pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

		// a linear scale that maps domain values to a percent from 0..1
		scale = d3.scaleLinear()
			.range([0,1])
			.domain([config.minValue, config.maxValue]);
			
		ticks = scale.ticks(config.majorTicks);
		tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
		
		arc = d3.arc()
			.innerRadius(r - config.ringWidth - config.ringInset)
			.outerRadius(r - config.ringInset)
			.startAngle(function(d, i) {
				var ratio = d * i;
				return deg2rad(config.minAngle + (ratio * range));
			})
			.endAngle(function(d, i) {
				var ratio = d * (i + 1);
				return deg2rad(config.minAngle + (ratio * range));
			});
	}
	that.configure = configure;
	
	function centerTranslation() {
		return 'translate(' + (config.clipWidth / 2 + config.marginSides) +','+ ((r * 1.1) + config.marginTop) +')';
	}
	
	function isRendered() {
		return (svg !== undefined);
	}
	that.isRendered = isRendered;
	
	function render(newValue) {
		svg = container
			.append('svg:svg')
				.attr('class', 'gauge')
				.attr('width', config.clipWidth + config.marginSides * 2)
				.attr('height', config.clipHeight + config.marginTop);
		
		var centerTx = centerTranslation();
		
		var arcs = svg.append('g')
				.attr('class', 'arc')
				.attr('transform', centerTx);
		
		arcs.selectAll('path')
				.data(tickData)
			.enter().append('path')
				.attr('fill', function(d, i) {
					return config.arcColorFn(d * i);
				})
				.attr('d', arc);
		
		var lg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);
		lg.selectAll('text')
				.data(ticks)
			.enter().append('text')
				.attr('transform', function(d) {
					var ratio = scale(d);
					var newAngle = config.minAngle + (ratio * range);
					return 'rotate(' + (newAngle + config.labelAngleOffset) +') translate(0,' + (config.labelInset - r) +')';
				})
				.text(config.labelFormat);


		var lineData = [ [config.pointerWidth / 2, 0], 
						[0, -pointerHeadLength],
						[-(config.pointerWidth / 2), 0],
						[0, config.pointerTailLength],
						[config.pointerWidth / 2, 0] ];
		var pointerLine = d3.line().curve(d3.curveLinear);

		var pg_b = svg.append('g').data([lineData])
				.attr('class', 'pointer_benchmark')
				.attr('transform', centerTx);
				
		pointer_bench = pg_b.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' + config.minAngle +')')
			.attr('visibility', 'hidden');

		var pg = svg.append('g').data([lineData])
				.attr('class', 'pointer_portfolio')
				.attr('transform', centerTx);
				
		pointer_port = pg.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' + config.minAngle +')');

		var scen_line_g = svg.append('g')
			.attr('class', 'scenario_line')
			.attr('transform', centerTx);

		scen_line = scen_line_g.append('line')
			.attr('x1', - r + config.ringInset)
			.attr('y1', 0)
			.attr('x2', - r + config.ringInset + config.ringWidth)
			.attr('y2' , 0)
			.attr('transform', 'rotate(' + config.minAngle +')');

		if (config.annotate) {
			scen_label = scen_line_g.append('text')
				.attr('x', - r - config.labelInset - config.annotationOffsetScen)
				.attr('y', 0)
				.text(config.scenLabel);

			let metricTextLabels = [
			{label: 'Full mitigation', value_low: 0, value_high: 0}, 
			{label: 'Managed mitigation', value_low: 0, value_high: 1},
			{label: 'Managed disruption', value_low: 1, value_high: 1.5},
			{label: 'Unmanaged disruption', value_low: 1.5, value_high: 8}
			];

			metricTextLabels.forEach(d => d.midAngle = config.minAngle + (scale((d.value_low + d.value_high) / 2) * range));
			metricTextLabels.forEach(d => d.rightHalf = Math.sin(deg2rad(d.midAngle)) > 0);
			metricTextLabels.forEach(d => d.texty = Math.round(point_coord(d.midAngle, r)[1]));
    		metricTextLabels.forEach(d => 
      			d.textx = 
        			d.rightHalf ? 
          			Math.round(point_coord(d.midAngle, r)[0]) + config.annotationOffsetValues : 
          			Math.round(point_coord(d.midAngle, r)[0]) - config.annotationOffsetValues
      		);

			var mlg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);

			mlg.selectAll('text')
				.data(metricTextLabels)
				.enter()
				.append('text')
				.attr('class', 'chart_title')
				.attr("x", function(d, i) {return d.textx})
      			.attr("y", function(d, i) {return d.texty})
      			.attr("text-anchor", function(d, i) {
            		return d.rightHalf ? "start" : "end";
          		})
      			.style("dominant-baseline", "middle")
				.text(d => d.label);
		}
		

		if (config.title != null) {
			svg.append('text')
		        .attr('x', (config.clipWidth / 2 + config.marginSides))             
		        .attr('y', (config.marginTop * 0.5))
		        .attr('text-anchor', 'middle')  
		        .attr('class', 'chart_title')
		        .text(config.title);
		}
			
		update_portfolio(newValue === undefined ? 0 : newValue);
	}
	that.render = render;
	function update(newValue, pointer, newConfiguration) {
		if ( newConfiguration  !== undefined) {
			configure(newConfiguration);
		}
		let newValueRestricted = Math.min(6,Math.max(0, newValue));

		var ratio = scale(newValueRestricted);
		var newAngle = config.minAngle + (ratio * range);
		pointer.transition()
			.duration(config.transitionMs)
			.ease(d3.easeElastic)
			.attr('transform', 'rotate(' + newAngle +')');
	}
	that.update = update;

	function update_portfolio(newValue, newConfiguration) {
		update(newValue, pointer_port, newConfiguration)
	}
	that.update_portfolio = update_portfolio;

	function update_benchmark(newValue, newConfiguration) {
		pointer_bench.attr('visibility', 'visible')
		update(newValue, pointer_bench, newConfiguration)
	}
	that.update_benchmark = update_benchmark;

	function update_scenario_line(newValue, newConfiguration) {
		if ( newConfiguration  !== undefined) {
			configure(newConfiguration);
		} 

		let newValueRestricted = Math.min(6,Math.max(0, newValue));

		var ratio = scale(newValueRestricted);
		var newAngle = ratio * range;
		scen_line.transition()
			.duration(config.transitionMs)
			.ease(d3.easeElastic)
			.attr('transform', 'rotate(' + newAngle +')');

		if (config.annotate) {
			scen_label.transition()
				.duration(config.transitionMs)
				.ease(d3.easeElastic)
				.attr('transform', 'rotate(' + (newAngle + config.labelAngleOffset) +')');
		}
	}
	that.update_scenario_line = update_scenario_line;

	configure(configuration);
	
	return that;
};

function colourWheel(d) {
	var colours = ['#008D36', '#FFD204', '#E69703', '#DB5B00', '#EB2100', '#A30202'];

	return colours[Math.round(d * this.majorTicks)]
}