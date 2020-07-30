var currentSlide = 0;
var transitionTimer = 100;
var infoMap = [];
var coords = [];
var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var formatDay = d3.timeFormat("%b %d, %Y");
var formatMonth = d3.timeFormat("%b");
var parseDate = d3.timeFormat("%m/%d/%y");
var timeParse = d3.timeParse("%m/%d/%Y");
var navTimer;
var chartStartDate, startDate, endDate;
var playButton, prevButton, nextButton;
var targetValue, currentValue = 0;
var sliderSVG, xsl, slider, handle, label;
var chartSVG, xscaleChart, xAxis, yscaleChart, yAxis, minCases, maxCases, casesPlot, deathsPlot, dataset, diffDays, filteredData;
var bars, tooltip, tooltipLine, bartooltip, tipBox, barTipBox;
var margin = {
        top: 10,
        right: 30,
        bottom: 50,
        left: 40
    },
    width = 820 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;
var slmargin = {
        top: 25,
        right: 0,
        bottom: 0,
        left: 15
    },
    slwidth = 400 - slmargin.left - slmargin.right,
    slheight = 100 - slmargin.top - slmargin.bottom;
var moving = false;


//////////Bar chart Vars

var barsvg, bdataset, bstartDate, filteredStateData, xdomainBar, xAxisBar, xscaleBar, maxCasesBar, minCasesBar, yscaleBar, yAxisBar, barselect;
var barmargin = {
        top: 20,
        right: 30,
        bottom: 100,
        left: 50
    },
    bwidth = 820 - barmargin.left - barmargin.right,
    bheight = 320 - barmargin.top - barmargin.bottom;


async function init() {

    const dailyData = await d3.csv("US-daily.csv",
        function(d) {
            return {
                date: d3.timeParse("%m/%d/%Y")(d.Date),
                newCases: +d.NewCases,
                newDeaths: +d.NewDeaths,
                totalCases: d.TotalCases,
                totalDeaths: d.TotalDeaths
            }
        },
    );

    dailyData.sort(function(b, a) {
        return b.date - a.date
    });

    const states = await d3.csv("us-states.csv",
        function(d) {
            return { date: d3.timeParse("%Y-%m-%d")(d.date), cases: +d.cases, deaths: +d.deaths, dateStr: d.date, state: d.state }
        },
    );

    states.sort(function(b, a) { return a.cases - b.cases });

    initInfoMap();
    chartSVG = createChartSVG();
    chartStartDate = new Date(2020, 1, 3);
    startDate = d3.min(dailyData, d => d.date);
    endDate = d3.max(dailyData, d => d.date);

    diffDays = Math.ceil((endDate - startDate)) / (1000 * 60 * 60 * 24);

    currentValue = 0;
    targetValue = slwidth - slmargin.right - slmargin.left - 50

    createButtons();
    playButton = d3.select("#play-button");
    prevButton = d3.select("#prev-button");
    nextButton = d3.select("#next-button");
    document.getElementById("prev-button").disabled = true;

    createSlider();
    dataset = dailyData;
    filteredData = dataset.filter(function(d) {
        return d.date <= chartStartDate;
    });

    xscaleChart = d3.scaleTime()
        .domain(d3.extent(dailyData, function(d) {
            return d.date;
        }))
        .range([0, width]);
    xAxis = chartSVG.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xscaleChart));

    maxCases = d3.max(dailyData, d => d.newCases);
    minCases = d3.min(dailyData, d => d.newCases);

    // Add Y axis
    yscaleChart = d3.scaleLinear() //og().base(2)
        .domain([minCases, maxCases])
        .range([height, 0]);
    yAxis = chartSVG.append("g")
        .call(d3.axisLeft(yscaleChart));

    updateYAxis(chartStartDate);
    updateSlider(chartStartDate);
    casesPlot = casesLine(filteredData);
    deathsPlot = deathsLine(filteredData);


    // Handmade legend
    chartSVG.append("circle").attr("cx", (width / 2) - 120).attr("cy", height + 30).attr("r", 6).style("fill", "steelblue")
    chartSVG.append("circle").attr("cx", (width / 2)).attr("cy", height + 30).attr("r", 6).style("fill", "#d92626")
    chartSVG.append("text").attr("x", (width / 2) - 110).attr("y", height + 32).text("New Cases").style("font-size", "12px").attr("alignment-baseline", "middle")
    chartSVG.append("text").attr("x", (width / 2) + 10).attr("y", height + 32).text("New Deaths").style("font-size", "12px").attr("alignment-baseline", "middle")

    infoUpdate(currentSlide);
    clearAnnotation();
    annotate();
    toggleSceneBtns();

    bars = barchart(states);

    playButton.on("click", playFunction);
    nextButton.on("click", nextslide);
    prevButton.on("click", previous);

    tooltip = d3.select('#tooltip');
    bartooltip = d3.select('#bartooltip');
    tooltipLine = chartSVG.append('line');
    barselect = d3.select("#barSelect");

    barselect.on("change", changeBars);

    tipBox = chartSVG.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip);
}

function removeTooltip() {
    if (tooltip) tooltip.style('display', 'none');
    if (tooltipLine) tooltipLine.attr('stroke', 'none');
}

function drawTooltip() {
    const hoverDate = xscaleChart.invert(d3.mouse(tipBox.node())[0]);

    tooltipLine.attr('stroke', 'black')
        .attr('x1', xscaleChart(hoverDate))
        .attr('x2', xscaleChart(hoverDate))
        .attr('y1', 0)
        .attr('y2', height);

    if (hoverDate < filteredData[filteredData.length - 1].date && hoverDate >= filteredData[0].date) {
        var bisect = d3.bisector(function(d) { return d.date; }).left;
        var i = bisect(filteredData, hoverDate, 1);
        var selectedData = filteredData[i];
        if (hoverDate > new Date(2020, 5, 10)) {
            tooltip.style("opacity", 0.8)
                .style("display", "block")
                .style("left", (d3.event.pageX) - 205 + "px")
                .style("top", (d3.event.pageY) + 5 + "px")
                .html(getTooltipString(selectedData));
        } else {
            tooltip.style("opacity", 0.8)
                .style("display", "block")
                .style("left", (d3.event.pageX) + 5 + "px")
                .style("top", (d3.event.pageY) + 5 + "px")
                .html(getTooltipString(selectedData));
        }
    } else {
        removeTooltip();
    }
}

function getTooltipString(selectedData) {
    return "<p align='center'>" + formatDay(selectedData.date) + "</p>" +
        "<table>" +
        "<tr><td>Total Cases</td><td>" + selectedData.totalCases + "</td></tr>" +
        "<tr><td>Total Deaths</td><td>" + selectedData.totalDeaths + "</td></tr>" +
        "<tr><td>New Cases</td><td>" + selectedData.newCases + "</td></tr>" +
        "<tr><td>New Deaths</td><td>" + selectedData.newDeaths + "</td></tr>" +
        "</table>";
}

function previous() {
    clearAnnotation();
    console.log("currentSlide:" + currentSlide);
    currentSlide = currentSlide - 1;
    currentValue = xsl(timeParse(coords[currentSlide].date));
    update(timeParse(coords[currentSlide].date));
    /* if (currentSlide > 0 && currentSlide < coords.length - 1) {
        document.getElementById("prev-button").disabled = false;
    } else {
        document.getElementById("prev-button").disabled = true;
        document.getElementById("next-button").disabled = false;
        currentSlide = 0;
    } */
    infoUpdate(currentSlide);
    annotate();
    toggleSceneBtns();
}

function nextslide() {
    clearAnnotation();
    if (++currentSlide < coords.length) {
        navTimer = setInterval(moveForward, 50);
    } else {
        currentSlide = coords.length - 1;
        annotate();
        //document.getElementById("next-button").disabled = true;
    }
    //annotate();
    toggleSceneBtns();
    infoUpdate(currentSlide);
}

function playFunction() {
    var button = d3.select(this);
    if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        // timer = 0;
        button.text("Play");
    } else {
        moving = true;
        timer = setInterval(step, 500);
        button.text("Pause");
    }
    console.log("Slider moving: " + moving);
}

function moveForward() {
    //console.log("----Step - currentValue: " + currentValue)
    if (currentValue < 0) currentValue = 1;
    update(xsl.invert(currentValue));

    if (xsl.invert(currentValue) >= timeParse(coords[currentSlide].date) || currentValue >= targetValue) {
        annotate();
        moving = false;
        //currentValue = 0;
        //document.getElementById("next-button").disabled = false;
        clearInterval(navTimer);
        d3.select("#scene-btn").style("pointer-events", "all");
    } else {
        d3.select("#scene-btn").style("pointer-events", "none");
        currentValue = currentValue + (targetValue / diffDays);
    }
}


function step() {
    console.log("----Step - currentValue: " + currentValue)
    if (currentValue < 0) currentValue = 1;
    update(xsl.invert(currentValue));
    currentValue = currentValue + (targetValue / diffDays);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        // timer = 0;
        playButton.text("Play");
        console.log("Slider moving: " + moving);
    }
}

function casesLine(data) {
    // Line
    line = chartSVG.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3.5)
        .attr("d", d3.line()
            .x(function(d) {
                return xscaleChart(d.date)
            })
            .y(function(d) {
                return yscaleChart(d.newCases)
            })
        )
    return line;
}

function deathsLine(data) {
    // Line
    line = chartSVG.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#d92626")
        .attr("stroke-width", 3.5)
        .attr("d", d3.line()
            .x(function(d) {
                return xscaleChart(d.date)
            })
            .y(function(d) {
                return yscaleChart(d.newDeaths)
            })
        )
    return line;
}

function updateYAxis(startDate) {
    if (startDate < timeParse("3/4/2020")) {
        yscaleChart = d3.scaleLinear()
            .domain([0, 40])
            .range([height, 0]);
        yAxis.transition().call(d3.axisLeft(yscaleChart));
    } else if (startDate < timeParse("3/26/2020")) {
        yscaleChart = d3.scaleLinear()
            .domain([0, 15000])
            .range([height, 0]);
        yAxis.transition().call(d3.axisLeft(yscaleChart));
    } else if (startDate < timeParse("4/30/2020")) {
        yscaleChart = d3.scaleLinear()
            .domain([0, 50000])
            .range([height, 0]);
        yAxis.transition().call(d3.axisLeft(yscaleChart));
    } else {
        yscaleChart = d3.scaleLinear()
            .domain([minCases, maxCases])
            .range([height, 0]);
        yAxis.transition().call(d3.axisLeft(yscaleChart));
    }

}

function updateSlider(h) {
    handle.attr("cx", xsl(h));
    label
        .attr("x", xsl(h))
        .text(parseDate(h));
    currentValue = xsl(h);
}

function update(h) {
    chartStartDate = h;
    updateBars(h);

    if (currentValue < 0) {
        currentValue = 2;
        h = xsl.invert(currentValue);
    }
    updateSlider(h);
    // filter data set and redraw plot
    filteredData = dataset.filter(function(d) {
        return d.date <= h;
    });
    //console.log("update date:" + h);
    var tempDate, tempCases;
    updateYAxis(h);
    casesPlot.datum(filteredData)
        .attr("d", d3.line()
            .x(function(d) {
                return xscaleChart(d.date);
            })
            .y(function(d) {
                return yscaleChart(d.newCases)
            })
        );
    deathsPlot.datum(filteredData)
        .attr("d", d3.line()
            .x(function(d) {
                return xscaleChart(d.date)
            })
            .y(function(d) {
                return yscaleChart(d.newDeaths)
            })
        );
    //toggleSceneBtns();
}


function updateScene(num) {
    clearAnnotation();
    console.log("Scenbutton selected: " + num);
    if (currentSlide < num) {
        currentSlide = num;
        //toggleSceneBtns();
        navTimer = setInterval(moveForward, 50);
    } else {
        currentSlide = num;
        currentValue = xsl(timeParse(coords[currentSlide].date));
        update(timeParse(coords[currentSlide].date));
        annotate();
    }
    toggleSceneBtns();
    infoUpdate(currentSlide);
}

function toggleSceneBtns() {
    console.log("currentSlide:" + currentSlide + " maxSlides:" + coords.length);
    for (var i = 0; i < coords.length; i++) {
        document.getElementById("scenebtn-" + i).disabled = false;
    }
    document.getElementById("scenebtn-" + currentSlide).disabled = true;

    if (currentSlide >= coords.length - 1) {
        document.getElementById("next-button").disabled = true;
    } else {
        document.getElementById("next-button").disabled = false;
    }

    if (currentSlide > 0 && currentSlide <= coords.length - 1) {
        document.getElementById("prev-button").disabled = false;
    } else {
        document.getElementById("prev-button").disabled = true;
    }
}

function createButtons() {
    d3.select("#scene-btn").append("button")
        .attr("id", "prev-button")
        .text("Prev")
    coords.forEach((d, i) => {
        d3.select("#scene-btn").append("button")
            .attr("onclick", "updateScene(" + i + ")")
            .attr("class", "numbtns")
            .attr("id", "scenebtn-" + i)
            .text(i + 1);
    })
    d3.select("#scene-btn").append("button")
        .attr("id", "next-button")
        .text("Next")
}

function clearAnnotation() {
    chartSVG.selectAll("#antCir").remove();
    chartSVG.selectAll("#antPath").remove();
    chartSVG.selectAll("#antText").remove();
}

function infoUpdate() {

    d3.select("#info")
        .html(infoMap[currentSlide].data);
    //.text("Current slide: " + slide + " / " + (keyDates.length - 1) + "------" + " Date: " + keyDates[slide])
}

function annotate() {
    console.log();
    var xcoord = 0,
        ycoord = 0,
        x2coord = 0,
        y2coord = 0;
    chartSVG.append("circle")
        .transition().duration(900)
        .attr("id", "antCir")
        .attr("cx", function() {
            xcoord = xscaleChart(timeParse(coords[currentSlide].x));
            return xcoord;
        })
        .attr("cy", function() {
            ycoord = yscaleChart(coords[currentSlide].y);
            return ycoord;
        })
        .attr("r", 3);
    console.log("xcoord:" + xcoord + ", ycoord:" + ycoord + " - currentSlide]: " + currentSlide);
    x2coord = xcoord + coords[currentSlide].ax;
    y2coord = ycoord + coords[currentSlide].ay;
    chartSVG.append("line")
        .transition().duration(900)
        .attr("id", "antPath")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("x1", xcoord)
        .attr("y1", ycoord)
        .attr("x2", x2coord)
        .attr("y2", y2coord)

    chartSVG.append("text")
        .transition().duration(900)
        .attr("id", "antText")
        .attr("x", x2coord + coords[currentSlide].textx)
        .attr("y", y2coord + coords[currentSlide].texty)
        .text(coords[currentSlide].text);
}

function createSlider() {
    xsl = d3.scaleTime().domain([startDate, endDate]).range([0, targetValue]).clamp(true);
    sliderSVG = d3.select("#sliderdiv")
        .append("svg")
        .attr("width", slwidth)
        .attr("height", slheight)
        .append("g")
        .attr("transform",
            "translate(" + slmargin.left + "," + slmargin.top + ")");

    slider = sliderSVG.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + slmargin.left + "," + slheight / 5 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xsl.range()[0])
        .attr("x2", xsl.range()[1])
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() {
                slider.interrupt();
            })
            .on("start drag", function() {
                currentValue = d3.event.x;
                var currDate = xsl.invert(currentValue);
                coords.forEach(function(item, index) {
                    if (currDate >= timeParse(item.date)) {
                        currentSlide = index;
                    }
                });
                clearAnnotation();
                annotate();
                infoUpdate();
                toggleSceneBtns();
                update(xsl.invert(currentValue));
            })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(xsl.ticks(10))
        .enter()
        .append("text")
        .attr("x", xsl)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) {
            return formatMonth(d);
        });

    handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    label = slider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(parseDate(startDate))
        .attr("transform", "translate(0," + (-25) + ")")
}

function createChartSVG() {
    return d3.select("#my_dataviz")
        .append("svg")
        .attr("id", "chartsvg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
}

function initInfoMap() {
    infoMap = [];
    infoMap.push({
        "data": "<h3>Jan. 21, 2020: First confirmed case in the United States</h3><p align='left'>CDC Confirms First US Coronavirus Case: A Washington state resident becomes the first person in the United States with a confirmed case of the 2019 novel coronavirus, having returned from Wuhan on January 15. The CDC soon after deploys a team to help with the investigation, including potential use of contact tracing</p>"
    });
    infoMap.push({
        "data": "<h3>Mar. 1, 2020: 1st death reported in United States</h3><p align='left'>The first COVID-19 death is reported in Washington state, after a man with no travel history to China dies on Feb. 28 at Evergreen Health Medical Center in Kirkland, Washington.Two deaths that occurred Feb. 26 at a nearby nursing home would later be recorded as the first COVID-19 deaths to occur in the United States. Later still, a death in Santa Clara, California, on Feb. 6 would be deemed the country's first COVID-19 fatality after an April autopsy.</p>"
    });
    infoMap.push({
        "data": "<h3>Mar. 13, 2020: Trump declares national emergency</h3><p align='left'>President Donald Trump declares a U.S. national emergency, which he says will open up $50 billion in federal funding to fight COVID-19.</p>"
    });
    infoMap.push({
        "data": "<h3>Apr. 16, 2020:	U.S. Coronavirus Death Toll Hits New Single-Day Record</h3><p align='left'>The U.S. coronavirus death toll reached 4,928 in 24 hours on Thursday, nearly doubling the previous single-day record, according to data compiled by Johns Hopkins University.</p>"
    });
    infoMap.push({
        "data": "<h3>Jun. 1, 2020: Lift of Stay-at-home order</h3><p align='left'>Multiple states have lifted the stay-at-home order; outdoor gatherings of up to a hundred are allowed. Meanwhile, the total number of cases continued to increase</p>"
    });
    //infoMap.push({"data":"<h3>June 29, 2020</h3><p align='left'>The US government starts Lockdown process across the country</p><h3>June 27, 2020</h3><p align='left'>The US government eases the Lockdown and the cases starts to rise across the country</p>"});
    infoMap.push({
        "data": "<h3>Jul. 25, 2020: 78,427 Cases in one day</h3><p align='left'>Nationwide, cases increased by 78,427, the highest daily count on record, according to data compiled by Johns Hopkins University.</p><p align='left'>California and Florida becomes the top most infected states by pushing New York and New Jersey to 3rd and 5th places</p>"
    });

    coords.push({
        "x": "1/21/2020",
        "date": "2/3/2020",
        "y": 1,
        "ax": 50,
        "ay": -150,
        "text": "1st Confirmed Case in the US",
        "textx": 0,
        "texty": 0
    });
    coords.push({
        "x": "3/1/2020",
        "date": "3/3/2020",
        "y": 1,
        "ax": 50,
        "ay": -150,
        "text": "1st death in the US",
        "textx": 0,
        "texty": 0
    });
    coords.push({
        "x": "3/13/2020",
        "date": "3/25/2020",
        "y": 351,
        "ax": 50,
        "ay": -150,
        "text": "National Emergency declared",
        "textx": 0,
        "texty": 0
    });
    coords.push({
        "x": "4/16/2020",
        "date": "4/26/2020",
        "y": 4928,
        "ax": 50,
        "ay": -150,
        "text": "Max deaths in one day",
        "textx": 0,
        "texty": 0
    });
    //coords.push({"x": "4/28/2020", "y": 22541, "ax": 50, "ay": -150 });
    coords.push({
        "x": "6/1/2020",
        "date": "6/11/2020",
        "y": 19807,
        "ax": 50,
        "ay": -150,
        "text": "Stay-at-home order lifted",
        "textx": 0,
        "texty": 0
    });
    coords.push({
        "x": "7/25/2020",
        "date": "7/27/2020",
        "y": 78427,
        "ax": -150,
        "ay": 50,
        "text": "Max cases in one day",
        "textx": -100,
        "texty": 20
    });
}