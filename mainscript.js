export const lineGraph = (line_svg, data, date_format) => {
	const bisectDate = d3.bisector(d => d.date).left; 
	const xs = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, 1200]);
	const ys = d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).range([300, 0]);
	
	const annoText = line_svg.append("g").attr("transform", "translate(70,70)")
		.append("text")
			.attr("text-anchor", "end")
			.attr("fill", "green")
			.attr("alignment-baseline", "right");
	
	line_svg.append("g").attr("transform", "translate(70,70)")
		.append("path")
			.datum(data)
			.attr("class", "line-set")
			.attr("d", d3.line()
				.x(d => xs(d.date))
				.y(d => ys(d.cases)));

	
	const annotn = line_svg.append("g").attr("transform", "translate(70,70)").style("opacity", 1);
	
	if(data[0].state === undefined) {
		lineAnnotation(line_svg, data, xs, ys, "The major spike in cases occured between approximately 20-Dec-2021 and 14-Feb-2022");
	} else {
		lineAnnotation(line_svg, data, xs, ys, "All of states and territories were also experiencing a spike in cases around this time");
	}
	
	
	line_svg.append("g")
		.attr("transform", "translate(70,370)") 
		.call(d3.axisBottom(xs) 
			.ticks(8)
			.tickFormat(date_format));
	
	line_svg.append("g").attr("transform", "translate(70,70)").call(d3.axisLeft(ys)); 
	
	annotn.append("circle")
		.style("fill", "green")
		.style("stroke", "red")
		.attr("r", 5);
	
	annoText.append("tspan").attr("id", "tspan1");
	annoText.append("tspan").attr("id", "tspan2");
	annoText.append("tspan").attr("id", "tspan3");
	
	line_svg.append("rect").attr("transform", "translate(70,70)")
		.attr("width", 1200)
		.attr("height", 300)
		.style("fill", "none")
		.style("pointer-events", "all")
		.on("mouseover", e => {
			annotn.style("opacity", 1);
			annoText.style("opacity", 1);
		})
		.on("mousemove", e => {
			let x0 = xs.invert((d3.pointer(e, this)[0])), 
				i = bisectDate(data, x0, 1),
				d = null;
			
			if(data[i] === undefined) {
				d = data[i - 1];
			} else {
				d = (x0 - data[i - 1].date > data[i].date - x0) ? data[i] : data[i - 1];
			}

			annotn.select("circle")
				.attr("cx", xs(d.date))
				.attr("cy", ys(d.cases));
			
			annoText.select("#tspan1")
				.html("Date: "+d.date.toLocaleDateString('en-US'))
					.attr("x", xs(d.date) + 70) 
					.attr("y", ys(d.cases) - 45)
					.attr("y", ys(d.cases) - 55);
			
			annoText.select("#tspan2")
				.html("Number of Cases: "+d.cases.toLocaleString('en-US'))
					.attr("x", xs(d.date) + 70)
					.attr("y", ys(d.cases) - 30)
					.attr("y", ys(d.cases) - 40);

			annoText.select("#tspan3")
				.html("Number of Deaths: "+d.deaths.toLocaleString('en-US'))
					.attr("x", xs(d.date) + 70)
					.attr("y", ys(d.cases) - 15)
					.attr("y", ys(d.cases) - 25);

			
		})
		.on("mouseout", e => {
			annotn.style("opacity", 0);
			annoText.style("opacity", 0);
		});
}

const lineAnnotation = (line_svg, data, xs, ys, labelString) => {
	const annotations = [{
		note: {
			title: "COVID-19 Spike",
			label: labelString,
			align: "middle"
		},
		
		x: xs(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2021-12-20').valueOf())].date),
		y: ys(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2021-12-20').valueOf())].cases),
		dx: -400,
		dy: -0.5,
		subject: {
			
			width: ((xs(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2022-02-14').valueOf())].date)) - 
					(xs(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2021-12-20').valueOf())].date))),
			height: ((ys(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2022-02-14').valueOf())].cases)) - 
							(ys(data[data.findIndex(d => d.date.valueOf() === d3.timeParse("%Y-%m-%d")('2021-12-20').valueOf())].cases)))
		},
		color: ["purple"],
		connector: { end: "arrow" },

	}];
	
	const makeAnnotations = d3.annotation()
		.editMode(false)
		.notePadding(15)
		.type(d3.annotationCalloutRect)
		.annotations(annotations);
		
	line_svg.append("g").attr("transform", "translate(70,70)")
		.attr("class", "annotation-group")
		.call(makeAnnotations);
}

export const barGraph = (change_svg, data, date_format, tooltip) => {
	const xs = d3.scaleBand().domain(data.map(d => d.date)).range([0, 1200]); 
	const cs = d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).range([300, 0]);
	
	const extent = [[0, 0], [1200, 300]];
	
	change_svg.call(d3.zoom()
		.scaleExtent([1, 8])
		.translateExtent(extent)
		.extent(extent)
		.on("zoom", e => {
			xs.range([0, 1200].map(d => e.transform.applyX(d)));
			change_svg.selectAll(".all-bars rect").attr("x", d => xs(d.date)).attr("width", xs.bandwidth());
			change_svg.selectAll(".x-axis").call(d3.axisBottom(xs)
				.tickValues(xs.domain().filter((d, i) => !(i%100)))
				.tickFormat(date_format));
		}));
	
	change_svg.append("g").attr("transform", "translate(70,70)")
		.attr("class", "all-bars")
		.selectAll("rect")
		.data(data).enter().append("rect")
			.attr("class", "stroke-inactive")
			.attr("width", xs.bandwidth())
			.attr("height", 0)
			.attr("x", d => xs(d.date))
			.attr("y", 300)
			.on("mouseover", e => {
					tooltip.style("opacity", 1)
							.html("Date: "+e.target.__data__.date.toLocaleDateString('en-US')+"<br>Rate of Increase from previous day: "+e.target.__data__.cases.toLocaleString("en-US")+" cases");
					d3.select(e.target).attr("class", "stroke-active");
				})
			.on("mousemove", e => {
				tooltip.style("left", (e.pageX) + "px")
						.style("top", (e.pageY) + "px");
			})
			.on("mouseleave", e => {
					tooltip.style("opacity", 0);
					d3.select(e.target).attr("class", "stroke-inactive");
				})
			.transition().duration(3000).delay(500)
				.attr("height", d => { return ((300 - cs(d.cases)) < 0) ? 0 : (300 - cs(d.cases)); })
				.attr("y", d => cs(d.cases));
	
	change_svg.append("g")
		.attr("transform", "translate(70,370)") 
		.attr("class", "x-axis")
		.call(d3.axisBottom(xs)
			.tickValues(xs.domain().filter((d, i) => !(i%100))) 
			.tickFormat(date_format));
	
	change_svg.append("g").attr("transform", "translate(70,70)").attr("class", "y-axis").call(d3.axisLeft(cs));
}


export const treemapSetup = (map_svg, state_date, width, height) => {
    const root = d3.stratify().id(d => d.state).parentId(d => d.region)(state_date); 
	root.sum(d => +d.cases);

	d3.treemap().size([width, height]).padding(0.75)(root);

	const state_leaves = map_svg.selectAll("g").data(root.leaves()).enter().append("g").attr("transform", d => ("translate(" + d.x0 + "," + d.y0 + ")" ));

	state_leaves.append("title")
		.text(d => "State/Territory: " + d.data.state + "\nCases: " + d.value.toLocaleString("en-US") + " case(s)\nPercent of National Cases: " + ((d.value/root.value)*100).toFixed(2) + "%");

	state_leaves.append("rect")
		.attr("id", (d, i) => (d.leafId = "leaf-" + (i+1)))
		.attr("class", d => {
			switch(d.parent.id) {
				case "Northeast":
					return "ne-tree";
				case "Midwest":
					return "mw-tree";
				case "South":
					return "st-tree";
				case "West":
					return "wt-tree";
				case "Territories":
					return "ter-tree";
			}
			
		})
		.attr("width", d => d.x1 - d.x0)
		.attr("height", d => d.y1 - d.y0);
	
	state_leaves.append("clipPath")
		.attr("id", (d, i) => (d.clipId = "clip-" + (i+1)))
		.append("use")
			.attr("xlink:href", d => ("#" + d.leafId));
	
	state_leaves.append("text")
	.attr("clip-path", d => ("url(#" + d.clipId + ")"))
	.attr("class", "title-size")
    .selectAll("tspan")
	.data(d => d.data.state.split(" ")) 
	.enter().append("tspan")
		.attr("x", 2)
		.attr("y", (d, i, nodes) => (((i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9) + "em"))
		.attr("fill-opacity", 0.85)
			.text(d => d);
}

export const nationalsvg = (us_line_svg, us_change_svg, data_us, date_format, change_tooltip) => {
	//Gets rate of change data from the main data source
	const change_data_us = data_us.map((d, i, data_us) => {
		const value = {
			date: d.date,
			cases: (i-1) === -1 ? (data_us[i].cases - 0) : (data_us[i].cases - data_us[i-1].cases),
			deaths: (i-1) === -1 ? (data_us[i].deaths - 0) : (data_us[i].deaths - data_us[i-1].deaths)
		};
		return value;
	});
	
	lineGraph(us_line_svg, data_us, date_format);
	barGraph(us_change_svg, change_data_us, date_format, change_tooltip);
}

export const stateSVG = (state_line_svg, state_change_svg, data_states, state, date_format, change_tooltip) => {
	//Filters main data source for data of the selected state and gets the rate of change data for that state
	const data_single_state = data_states.filter(d => d.state === state);
	
	const change_data_single_state = data_single_state.map((d, i, data_single_state) => {
		const value = {
			date: d.date,
			state: d.state,
			fips: d.fips,
			cases: (i-1) === -1 ? (data_single_state[i].cases - 0) : (data_single_state[i].cases - data_single_state[i-1].cases),
			deaths: (i-1) === -1 ? (data_single_state[i].deaths - 0) : (data_single_state[i].deaths - data_single_state[i-1].deaths)
		};
		return value;
	});
	
	d3.select("#stateLine").text("Number of COVID-19 Cases in "+state+", "+data_single_state[0].date.toLocaleDateString('en-US')+" - Present");
	lineGraph(state_line_svg, data_single_state, date_format);
	d3.select("#stateChange").text("Rate of Increase of COVID-19 cases per day in "+state+", "+data_single_state[0].date.toLocaleDateString('en-US')+" - Present");
	barGraph(state_change_svg, change_data_single_state, date_format, change_tooltip);
}

export const treeSVG = (map_svg, data_states, input_date, width, height) => {

	//Filters state data by the input date, then adds hierarchy to the data by grouping states by region using FIPS codes
	const state_date = data_states.filter(d => d.date.valueOf() === input_date.valueOf()).map(d => {

		if((d.fips === "09") || (d.fips === "23") || (d.fips === "25") ||  (d.fips === "33") || (d.fips === "34") || (d.fips === "36") || (d.fips === "42") || (d.fips === "44") || (d.fips === "50")) {
			return initValueOfData(d, "Northeast");

		} else if ((d.fips === "17") || (d.fips === "18") || (d.fips === "19") || (d.fips === "20") || (d.fips === "26") || (d.fips === "27") || (d.fips === "29") || (d.fips === "31") || (d.fips === "38") || (d.fips === "39") || (d.fips === "46") || (d.fips === "55")) {

			return initValueOfData(d, "Midwest");

		} else if ((d.fips === "01") || (d.fips === "05") || (d.fips === "10") || (d.fips === "11") || (d.fips === "12") || (d.fips === "13") || (d.fips === "21") || (d.fips === "22") || (d.fips === "24") || (d.fips === "28") || (d.fips === "37") || (d.fips === "40") || (d.fips === "45") || (d.fips === "47") || (d.fips === "48") || (d.fips === "51") || (d.fips === "54")) {

			return initValueOfData(d, "South");

		} else if ((d.fips === "02") || (d.fips === "04") || (d.fips === "06") || (d.fips === "08") || (d.fips === "15") || (d.fips === "16") || (d.fips === "30") || (d.fips === "32") || (d.fips === "35") || (d.fips === "41") || (d.fips === "49") || (d.fips === "53") || (d.fips === "56")) {

			return initValueOfData(d, "West");

		} else {
			return initValueOfData(d, "Territories");
		}
	});

	//Added these to the front of the data array so that the hierarchy has root nodes for each region and the country as a whole
	state_date.unshift({
		date: null,
		state: "United States",
		region: null,
		fips: null,
		cases: null,
		deaths: null
	}, initValueOfData("nodata", "Northeast"), initValueOfData("nodata", "Midwest"), initValueOfData("nodata", "South"), initValueOfData("nodata", "West"), initValueOfData("nodata", "Territories"));

	d3.select("#treemapChange").text("Treemap of cases in the U.S. on "+input_date.toLocaleDateString("en-US"));
	treemapSetup(map_svg, state_date, width, height);

}

const initValueOfData = (d, region) => {

	if (d === "nodata") {
		const value = {
			date: null,
			state: region,
			region: "United States",
			fips: null,
			cases: null,
			deaths: null
		};
		return value;
	} else {
		const value = {
			date: d.date,
			state: d.state,
			region: region,
			fips: d.fips,
			cases: d.cases,
			deaths: d.deaths
		};
		return value;
	}
}

const init = async () => {
	const data_us = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv", d => {
		return { date : d3.timeParse("%Y-%m-%d")(d.date), cases : Number(d.cases), deaths : Number(d.deaths) };
	});
	
	const data_states = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv", d => {
		return { date : d3.timeParse("%Y-%m-%d")(d.date), state : d.state, fips : d.fips, cases : Number(d.cases), deaths : Number(d.deaths) };
	});
	
	const states_all = data_states.map(d => d.state).filter((d, i, arr) => arr.indexOf(d) === i).sort(); 
	
	const state_dropdown = stateDropdown("states", states_all);
	const dateSlider = slideDate("dateSlider", data_us);


	
	d3.select("#usCanvas1").append("h2").text("Number of COVID-19 Cases in the U.S.");
	const us_line_svg = initSVG("#usCanvas1", (1200 + 2*(70)), (300 + 2*(70)));
	d3.select("#usCanvas2").append("h2").text("Rate of Increase of COVID-19 cases per day in the U.S., 4/01/2020 - Present");
	const us_change_tooltip = initTooltip("#usCanvas2") 
	const us_change_svg = initSVG("#usCanvas2", (1200 + 2*(70)), (300 + 2*(70)));
	
	/* ---------------------------------------------------------------------------------------------------------------------------------------------- */
	
	
	d3.select("#stateCanvas").append("h2").attr("id", "stateLine");
	const state_line_svg = initSVG("#stateCanvas", (1200 + 2*(70)), (300 + 2*(70)));
	d3.select("#stateCanvas").append("h2").attr("id", "stateChange");
	const state_change_tooltip = initTooltip("#stateCanvas") //Tooltip for bar chart is appended before bar chart svg. Very Important!
	const state_change_svg = initSVG("#stateCanvas", (1200 + 2*(70)), (300 + 2*(70)));
	
	/* ---------------------------------------------------------------------------------------------------------------------------------------------- */
	
	d3.select("#mapCanvas").append("h2").attr("id", "treemapChange");
	const map_svg = initSVG("#mapCanvas", (1200 + 2*(70)), (300 + 2*(70)));
	
	const date_format = d3.timeFormat("%m/%d/%Y");
	
	nationalsvg(us_line_svg, us_change_svg, data_us, date_format, us_change_tooltip);
	stateSVG(state_line_svg, state_change_svg, data_states, state_dropdown.value, date_format, state_change_tooltip);
	treeSVG(map_svg, data_states, data_us[dateSlider.value].date, (1200 + 2*(70)), (300 + 2*(70)));
	
	state_dropdown.addEventListener("change", event => {
		
		state_line_svg.selectAll("*").remove();
		state_change_svg.selectAll("*").remove();
		d3.select("#stateLine").html("");
		d3.select("#stateChange").html("");
		stateSVG(state_line_svg, state_change_svg, data_states, event.target.value, date_format, state_change_tooltip);
	});

	dateSlider.addEventListener("input" , event => {
		map_svg.selectAll("*").remove();
		d3.select("treemapChange").html("");
		treeSVG(map_svg, data_states, data_us[event.target.value].date, (1200 + 2*(70)), (300 + 2*(70)));
	})
}

const stateDropdown = (id, list) => {
	const dropdown = document.getElementById(id);

	list.forEach(d => {
		const opt = document.createElement("option");
		opt.value = d;
		opt.innerHTML = d;
		dropdown.appendChild(opt);
	});

	return dropdown;
}

const slideDate = (id, data) => {
	const date_input = document.getElementById(id);
	date_input.min = 0;
	date_input.max = data.length - 1;
	date_input.value = data.length - 1; 


	return date_input;
}

const initSVG = (id, width, height) => {
	return d3.select(id).append("svg").attr("viewBox", "0 0 "+width+" "+height).attr("width", "93%");

}

const initTooltip = (id) => {
	return d3.select(id).append("div")
				.style("opacity", 0)
				.attr("class", "tooltip");
}

init();