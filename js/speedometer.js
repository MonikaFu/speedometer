class speedometer {
	constructor(container, data, labels, opts) {
		let svgHeight = opts.svgHeight, svgWidth = opts.svgWidth;

		let container_div;
		if (typeof container === "string") {
		    container_div = document.querySelector(container);
		} else {
		    container_div = container;
		}

		d3.select(container_div).attr("chart_type", "speedometer");
		d3.select(container_div).attr("chart_type_data_download", "speedometer"); //matching the names in the export/ folder

		container_div.classList.add("d3chart");
		container_div.classList.add("speedometer_chart");

		var powerGauge = gauge(container_div, {
			size: svgWidth - 50,
			clipWidth: svgWidth,
			clipHeight: svgHeight,
			ringWidth: 30,
			minValue: 0,
			maxValue: 6,
			majorTicks: 6,
			transitionMs: 100,
			labelFormat: function(d) { return d < 6 ? d3.format('d')(d) : "6+";},
			arcColorFn: colourWheel
		});
		powerGauge.render();

		function updateReadings(data, isMainPortfolio, portfolioName, assetClass, sector, technology) {
			let subdata = data.filter(d => d.portfolio_name == portfolioName);
			subdata = subdata.filter(d => d.asset_class == assetClass);
			subdata = subdata.filter(d => d.sector == sector);
			subdata = subdata.filter(d => d.technology == technology);

			if (isMainPortfolio) {
				powerGauge.update_portfolio(subdata[0].disruption_score);
			} else {
				powerGauge.update_benchmark(subdata[0].disruption_score);
			}
		}
			
		updateReadings(data, true, "this_port", "Corporate Bonds", "Aggregated", "Aggregated");
		updateReadings(data, false, "benchmark", "Corporate Bonds", "Aggregated", "Aggregated");
	}
};

var gauge = function(container, configuration) {
	var that = {};
	var config = {
		size						: 400,
		clipWidth					: 200,
		clipHeight					: 110,
		ringInset					: 20,
		ringWidth					: 20,
		
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
		
		arcColorFn					: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#3e6c0a'))
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
		return 'translate('+(r + 5) +','+ r +')';
	}
	
	function isRendered() {
		return (svg !== undefined);
	}
	that.isRendered = isRendered;
	
	function render(newValue) {
		svg = d3.select(container)
			.append('svg:svg')
				.attr('class', 'gauge')
				.attr('width', config.clipWidth)
				.attr('height', config.clipHeight);
		
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
			
		update_portfolio(newValue === undefined ? 0 : newValue);
	}
	that.render = render;
	function update(newValue, pointer, newConfiguration) {
		if ( newConfiguration  !== undefined) {
			configure(newConfiguration);
		}
		var ratio = scale(newValue);
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

	configure(configuration);
	
	return that;
};

function colourWheel(d) {
	var colours = ['#008D36', '#FFD204', '#E69703', '#DB5B00', '#EB2100', '#A30202'];

	return colours[Math.round(d * this.majorTicks)]
}



