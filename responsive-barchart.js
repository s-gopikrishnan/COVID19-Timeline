function barchart(states) {
    // set the dimensions and margins of the graph
    var stmargin = {
            top: 20,
            right: 30,
            bottom: 100,
            left: 30
        },
        width = 820 - stmargin.left - stmargin.right,
        height = 320 - stmargin.top - stmargin.bottom;

    // append the svg object to the body of the page
    var svg = createChartSVG();


    ////////// plot //////////

    var plot = svg.append("g")
        .attr("class", "plot")
        .attr("transform", "translate(" + stmargin.left + "," + stmargin.top + ")");

    var dataset = states;
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDate = d3.timeFormat("%b %Y");
    var parseDate = d3.timeFormat("%m/%d/%y");
    var startDate = d3.min(states, d => d.date);
    var endDate = d3.max(states, d => d.date);
    var filteredData = dataset.filter(function(d) {
        return d.dateStr == dateToString(startDate);
    });
    console.log("filteredData: " + filteredData.length);


    var xdomain = filteredData.map(function(d) {
        return d.state;
    });
    var x = d3.scaleBand()
        .range([0, width])
        .domain(xdomain)
        .padding(0.2);
    var xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    xAxis
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    console.log("Data size to plot:" + filteredData.length)
    var maxCases = d3.max(filteredData, d => d.cases);
    var minCases = d3.min(filteredData, d => d.cases);

    console.log("min/max cases:" + minCases + " / " + maxCases);

    // Add Y axis
    var y = d3.scaleLinear() //og().base(2)
        .domain([minCases, maxCases])
        .range([height, 0]);
    var yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    drawPlot(filteredData);

    function drawPlot(data) {
        // Bars
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) {
                return x(d.state);
            })
            .attr("y", function(d) {
                return y(d.cases);
            })
            .attr("width", x.bandwidth())
            .attr("height", function(d) {
                console.log("height: " + height + "\n" +
                    "d.cases: " + d.cases + "\n" +
                    "y(d.cases): " + y(d.cases) + "\n");
                return height - y(d.cases);
            })
            .attr("fill", "#69b3a2")
            .exit().remove()

    }

    function updateBars(h) {

        // filter data set and redraw plot
        var filteredData = dataset.filter(function(d) {
            return d.dateStr == dateToString(h);
        });
        console.log("filtered dataset Size: " + filteredData.length);
        /* svg.remove();
        svg = createChartSVG(); */
        //x.domain(filteredData.map(function (d) { return d.state; }));

        filteredData.sort(function(b, a) {
            return a.cases - b.cases
        });

        maxCases = d3.max(filteredData, d => d.cases);
        minCases = d3.min(filteredData, d => d.cases);
        console.log("min/max cases:" + minCases + " / " + maxCases);

        //Update X Axis
        x = d3.scaleBand()
            .range([0, width])
            .domain(filteredData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);
        //xAxis.exit().remove();

        //x.domain(filteredData.map(function (d) { return d.state; }));
        xAxis.transition().duration(500).call(d3.axisBottom(x)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        y = d3.scaleLinear() //og().base(2)
            .domain([minCases, maxCases])
            .range([height, 0]);
        //y.domain([minCases, maxCases]);
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        var updatedSvg = svg.selectAll("rect")
            .data(filteredData);
        updatedSvg.exit().remove();
        // update bars
        updatedSvg
            .enter()
            .append("rect")
            .merge(updatedSvg)
            .transition()
            .duration(500)
            .attr("x", function(d) {
                return x(d.state);
            })
            .attr("y", function(d) {
                return y(d.cases);
            })
            .attr("width", x.bandwidth())
            .attr("height", function(d) {
                console.log("height: " + height + "\n" +
                    "d.cases: " + d.cases + "\n" +
                    "y(d.cases): " + y(d.cases) + "\n");
                return height - y(d.cases);
            })
            .attr("fill", "#69b3a2")

    }

    function dateToString(d) {
        return d.toISOString().substring(0, 10);
        //var str = d.getYear() + "-" + d.getMonth() + 
    }

    function createChartSVG() {
        return d3.select("#my_barchart")
            .append("svg")
            .attr("id", "chartsvg")
            .attr("width", width + stmargin.left + stmargin.right)
            .attr("height", height + stmargin.top + stmargin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + stmargin.left + "," + stmargin.top + ")");
    }

}