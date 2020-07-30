var filteredBarData;

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
    yscaleBar = d3.scaleLog().base(2)
        .domain([minCasesBar, maxCasesBar])
        .range([bheight, 0]);
    yAxisBar = barsvg.append("g")
        .call(d3.axisLeft(yscaleBar));

    /* tootipsvg = createToolitpSVG();
    barTipBox = tootipsvg.append('g')
        .attr('transform', 'translate(5,5)').append('rect')
        .attr('width', bwidth)
        .attr('height', bheight)
        .attr('opacity', 0)
        .on('mousemove', showBarTooltip)
        .on('mouseout', hideBarTooltip);
 */
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
            return bheight - yscaleBar(d.cases);
        })
        .attr("fill", "steelblue")
        .on("mouseover", showBarTooltip)
        .on("mouseout", hideBarTooltip)
        .exit().remove()



}

function showBarTooltip(d) {
    bartooltip.style("opacity", 0.8)
        .style("display", "block")
        .style("left", (d3.event.pageX) + 15 + "px")
        .style("top", (d3.event.pageY) + 10 + "px")
        .html(getBarTooltipString(d));
}

function hideBarTooltip(d) {
    if (bartooltip) bartooltip.style('display', 'none');
}

function getBarTooltipString(selectedData) {
    return "<p align='center'>" + formatDay(selectedData.date) + "</p>" +
        "<table>" +
        "<tr><td>State</td><td>" + selectedData.state + "</td></tr>" +
        "<tr><td>Total Cases</td><td>" + selectedData.cases + "</td></tr>" +
        "<tr><td>Total Deaths</td><td>" + selectedData.deaths + "</td></tr>" +
        "</table>";
}

function updateBars(h) {
    bstartDate = h;
    var updatedSvg;

    if ('cases' == barselect.node().value) {
        // filter data set and redraw plot
        filteredBarData = bdataset.filter(function(d) {
            return d.dateStr == dateToString(h);
        });
        filteredBarData.sort(function(b, a) {
            return a.cases - b.cases
        });

        maxCasesBar = d3.max(filteredBarData, d => d.cases);
        minCasesBar = d3.min(filteredBarData, d => d.cases);
        //console.log("min/max cases:" + minCasesBar + " / " + maxCasesBar);

        //Update X Axis
        xscaleBar = d3.scaleBand()
            .range([0, bwidth])
            .domain(filteredBarData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);

        xAxisBar.transition().call(d3.axisBottom(xscaleBar)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        yscaleBar = d3.scaleLog().base(2)
            .domain([minCasesBar, maxCasesBar])
            .range([bheight, 0]);
        yAxisBar.transition().call(d3.axisLeft(yscaleBar));

        updatedSvg = barsvg.selectAll("rect")
            .data(filteredBarData);
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
        var filteredBarData = bdataset.filter(function(d) {
            return (d.dateStr == dateToString(h) && d.deaths > 0);
        });
        filteredBarData.sort(function(b, a) {
            return a.deaths - b.deaths
        });

        maxCasesBar = d3.max(filteredBarData, d => d.deaths);
        minCasesBar = d3.min(filteredBarData, d => d.deaths);
        //console.log("min/max deaths:" + minCasesBar + " / " + maxCasesBar);

        //Update X Axis
        xscaleBar = d3.scaleBand()
            .range([0, bwidth])
            .domain(filteredBarData.map(function(d) {
                return d.state;
            }))
            .padding(0.2);

        xAxisBar.transition().call(d3.axisBottom(xscaleBar)).selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        //Update Y Axis
        yscaleBar = d3.scaleLog().base(2)
            .domain([minCasesBar, maxCasesBar])
            .range([bheight, 0]);
        //y.domain([minCases, maxCases]);
        yAxisBar.transition().call(d3.axisLeft(yscaleBar));

        var updatedSvg = barsvg.selectAll("rect")
            .data(filteredBarData);
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
            .attr("fill", "#d92626")
            /* if (filteredData[filteredData.length - 1].deaths == 0) {
                console.log("removing coz 0 data");
                barsvg.selectAll("rect").remove();
            } */
    }

    barsvg.selectAll("rect")
        .on("mouseover", showBarTooltip)
        .on("mouseout", hideBarTooltip);



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
/* 
function createToolitpSVG() {
    return d3.select("#my_barchart")
        .append("svg")
        .attr("id", "asdf")
        .attr("width", bwidth + barmargin.left + barmargin.right)
        .attr("height", bheight + barmargin.top + barmargin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + barmargin.left + "," + barmargin.top + ")");
} */