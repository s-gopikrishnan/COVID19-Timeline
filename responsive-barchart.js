function barchart(states) {
    // append the svg object to the body of the page
    barsvg = createBarChartSVG();
    bdataset = states;

    bstartDate = d3.min(states, d => d.date);
    filteredStateData = bdataset.filter(function(d) {
        return d.dateStr == dateToString(bstartDate);
    });
    console.log("filteredData: " + filteredStateData.length);


    xdomainBar = filteredStateData.map(function(d) {
        return d.state;
    });
    xscaleBar = d3.scaleBand()
        .range([0, bwidth])
        .domain(xdomainBar)
        .padding(0.2);
    xAxisBar = barsvg.append("g")
        .attr("transform", "translate(0," + bheight + ")")
        .call(d3.axisBottom(xscaleBar));
    xAxisBar
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    console.log("Data size to plot:" + filteredStateData.length)
    maxCasesBar = d3.max(filteredStateData, d => d.cases);
    minCasesBar = d3.min(filteredStateData, d => d.cases);

    //console.log("min/max cases:" + minCasesBar + " / " + maxCasesBar);

    // Add Y axis
    yscaleBar = d3.scaleLinear() //og().base(2)
        .domain([minCasesBar, maxCasesBar])
        .range([bheight, 0]);
    yAxisBar = barsvg.append("g")
        .call(d3.axisLeft(yscaleBar));

    drawBarchart(filteredStateData);
}

function changeBars() {
    updateBars(bstartDate);
}

function drawBarchart(data) {
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
        .attr("fill", "steelblue")
        .exit().remove()

}

function updateBars(h) {
    bstartDate = h;


    if ('cases' == barselect.node().value) {
        // filter data set and redraw plot
        var filteredData = bdataset.filter(function(d) {
            return d.dateStr == dateToString(h);
        });
        filteredData.sort(function(b, a) {
            return a.cases - b.cases
        });

        maxCasesBar = d3.max(filteredData, d => d.cases);
        minCasesBar = d3.min(filteredData, d => d.cases);
        //console.log("min/max cases:" + minCasesBar + " / " + maxCasesBar);

        //Update X Axis
        xscaleBar = d3.scaleBand()
            .range([0, bwidth])
            .domain(filteredData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);

        xAxisBar.transition().call(d3.axisBottom(xscaleBar)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        yscaleBar = d3.scaleLinear() //og().base(2)
            .domain([minCasesBar, maxCasesBar])
            .range([bheight, 0]);
        yAxisBar.transition().call(d3.axisLeft(yscaleBar));

        var updatedSvg = barsvg.selectAll("rect")
            .data(filteredData);
        updatedSvg.exit().remove();
        // update bars
        updatedSvg
            .enter()
            .append("rect")
            .merge(updatedSvg)
            .transition()

        .attr("x", function(d) {
                return xscaleBar(d.state);
            })
            .attr("y", function(d) {
                return yscaleBar(d.cases);
            })
            .attr("width", xscaleBar.bandwidth())
            .attr("height", function(d) {
                /* console.log("height: " + bheight + "\n" +
                    "d.cases: " + d.cases + "\n" +
                    "y(d.cases): " + yscaleBar(d.cases) + "\n"); */
                return bheight - yscaleBar(d.cases);
            })
            .attr("fill", "steelblue")
    } else if ('deaths' == barselect.node().value) {
        // filter data set and redraw plot
        var filteredData = bdataset.filter(function(d) {
            return (d.dateStr == dateToString(h) && d.deaths > 0);
        });
        filteredData.sort(function(b, a) {
            return a.deaths - b.deaths
        });

        maxCasesBar = d3.max(filteredData, d => d.deaths);
        minCasesBar = d3.min(filteredData, d => d.deaths);
        //console.log("min/max deaths:" + minCasesBar + " / " + maxCasesBar);

        //Update X Axis
        xscaleBar = d3.scaleBand()
            .range([0, bwidth])
            .domain(filteredData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);

        xAxisBar.transition().call(d3.axisBottom(xscaleBar)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        yscaleBar = d3.scaleLinear() //og().base(2)
            .domain([minCasesBar, maxCasesBar])
            .range([bheight, 0]);
        //y.domain([minCases, maxCases]);
        yAxisBar.transition().call(d3.axisLeft(yscaleBar));

        var updatedSvg = barsvg.selectAll("rect")
            .data(filteredData);
        updatedSvg.exit().remove();
        // update bars
        updatedSvg
            .enter()
            .append("rect")
            .merge(updatedSvg)
            .transition()

        .attr("x", function(d) {
                return xscaleBar(d.state);
            })
            .attr("y", function(d) {
                return yscaleBar(d.deaths);
            })
            .attr("width", xscaleBar.bandwidth())
            .attr("height", function(d) {
                /* console.log("height: " + bheight + "\n" +
                    "d.deaths: " + d.deaths + "\n" +
                    "y(d.deaths): " + yscaleBar(d.deaths) + "\n"); */
                return bheight - yscaleBar(d.deaths);
            })
            .attr("fill", "red")
            /* if (filteredData[filteredData.length - 1].deaths == 0) {
                console.log("removing coz 0 data");
                barsvg.selectAll("rect").remove();
            } */
    }



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