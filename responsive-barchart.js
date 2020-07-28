function barchart(states) {
    // set the dimensions and margins of the graph
    var barmargin = {
            top: 20,
            right: 30,
            bottom: 100,
            left: 30
        },
        bwidth = 820 - barmargin.left - barmargin.right,
        bheight = 320 - barmargin.top - barmargin.bottom;

    // append the svg object to the body of the page
    var barsvg = createBarChartSVG();


    var bdataset = states;

    var bstartDate = d3.min(states, d => d.date);
    var filteredStateData = bdataset.filter(function(d) {
        return d.dateStr == dateToString(bstartDate);
    });
    console.log("filteredData: " + filteredStateData.length);


    var xdomainBar = filteredStateData.map(function(d) {
        return d.state;
    });
    var xscaleBar = d3.scaleBand()
        .range([0, bwidth])
        .domain(xdomainBar)
        .padding(0.2);
    var xAxisBar = barsvg.append("g")
        .attr("transform", "translate(0," + bheight + ")")
        .call(d3.axisBottom(xscaleBar));
    xAxisBar
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    console.log("Data size to plot:" + filteredStateData.length)
    var maxCasesBar = d3.max(filteredStateData, d => d.cases);
    var minCasesBar = d3.min(filteredStateData, d => d.cases);

    console.log("min/max cases:" + minCasesBar + " / " + maxCasesBar);

    // Add Y axis
    var yscaleBar = d3.scaleLinear() //og().base(2)
        .domain([minCasesBar, maxCasesBar])
        .range([bheight, 0]);
    var yAxisBar = barsvg.append("g")
        .call(d3.axisLeft(yscaleBar));

    drawBarchart(filteredStateData);

    function drawBarchart(data) {
        // Bars
        barsvg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) {
                return xscaleBar(d.state);
            })
            .attr("y", function(d) {
                return yscaleBar(d.cases);
            })
            .attr("width", xscaleBar.bandwidth())
            .attr("height", function(d) {
                console.log("height: " + bheight + "\n" +
                    "d.cases: " + d.cases + "\n" +
                    "y(d.cases): " + yscaleBar(d.cases) + "\n");
                return bheight - yscaleBar(d.cases);
            })
            .attr("fill", "#69b3a2")
            .exit().remove()

    }

    function updateBars(h) {

        // filter data set and redraw plot
        var filteredData = bdataset.filter(function(d) {
            return d.dateStr == dateToString(h);
        });
        console.log("filtered dataset Size: " + filteredData.length);
        /* svg.remove();
        svg = createChartSVG(); */
        //x.domain(filteredData.map(function (d) { return d.state; }));

        filteredData.sort(function(b, a) {
            return a.cases - b.cases
        });

        maxCasesBar = d3.max(filteredData, d => d.cases);
        minCasesBar = d3.min(filteredData, d => d.cases);
        console.log("min/max cases:" + minCasesBar + " / " + maxCasesBar);

        //Update X Axis
        xscaleBar = d3.scaleBand()
            .range([0, bwidth])
            .domain(filteredData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);
        //xAxis.exit().remove();

        //x.domain(filteredData.map(function (d) { return d.state; }));
        xAxisBar.transition().duration(500).call(d3.axisBottom(xscaleBar)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        yscaleBar = d3.scaleLinear() //og().base(2)
            .domain([minCasesBar, maxCasesBar])
            .range([bheight, 0]);
        //y.domain([minCases, maxCases]);
        yAxisBar.transition().duration(500).call(d3.axisLeft(yscaleBar));

        var updatedSvg = barsvg.selectAll("rect")
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
                return xscaleBar(d.state);
            })
            .attr("y", function(d) {
                return yscaleBar(d.cases);
            })
            .attr("width", xscaleBar.bandwidth())
            .attr("height", function(d) {
                console.log("height: " + bheight + "\n" +
                    "d.cases: " + d.cases + "\n" +
                    "y(d.cases): " + yscaleBar(d.cases) + "\n");
                return bheight - yscaleBar(d.cases);
            })
            .attr("fill", "#69b3a2")

    }

    function dateToString(d) {
        return d.toISOString().substring(0, 10);
        //var str = d.getYear() + "-" + d.getMonth() + 
    }

    function createBarChartSVG() {
        return d3.select("#my_barchart")
            .append("svg")
            .attr("id", "chartsvg")
            .attr("width", bwidth + barmargin.left + barmargin.right)
            .attr("height", bheight + barmargin.top + barmargin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + barmargin.left + "," + barmargin.top + ")");
    }

}