d3.csv("assets/stateslived.csv", function (data) {

    var width = 960;
    var height = 500;

    var projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    //Create SVG element and append map to the SVG
    var svg = d3.select("#map-div")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Append Div for tooltip to SVG
    var div = d3.select("#map-div")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Define linear scale for output
    var color = d3.scaleLinear()
        .range(["rgb(213,222,217)", "rgb(69,173,168)", "rgb(84,36,55)", "rgb(217,91,67)"]);

    var legendText = ["Cities Lived", "States Lived", "States Visited", "Nada"];

    d3.json("assets/us-states.json", function (json) {
        for (var i = 0; i < data.length; i++) {
            var dataState = data[i].state;
            var dataValue = data[i].visited;
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;
                if (dataState == jsonState) {
                    json.features[j].properties.visited = dataValue;
                    break;
                }
            }
        }

        console.log("json.features.length: " + json.features.length);

        color.domain([0, 1, 2, 3]);
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "rgb(217,91,67)")
            .style("stroke-width", "1");
            
            /* .style("fill", function (d) {
                console.log("hello");
                // Get data value
                var value = d.properties.visited;

                if (value == 1) {
                    //If value exists…
                    console.log(color(value));
                    return color(value);
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            }); */


        // Map the cities I have lived in!
        d3.csv("assets/cities-lived.csv", function (data) {

            svg.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return projection([d.lon, d.lat])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.lon, d.lat])[1];
                })
                .attr("r", function (d) {
                    return Math.sqrt(d.years) * 4;
                })
                .style("fill", "rgb(217,91,67)")
                .style("opacity", .5)
                .style("stroke", "black")

                // Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
                // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
                .on("mouseover", function (d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.text(d.place)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })

                // fade out tooltip on mouse out               
                .on("mouseout", function (d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });

        // Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
        var legend = d3.select("#map-div").append("svg")
            .attr("class", "legend")
            .attr("width", 140)
            .attr("height", 200)
            .attr("custom-id", "legends-svg")
            .selectAll("g")
            .data(color.domain().slice().reverse())
            .enter()
            .append("g")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .data(legendText)
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(function (d) { return d; });

    });

});