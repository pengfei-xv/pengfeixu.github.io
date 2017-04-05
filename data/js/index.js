var margin = {top:30, right:20, bottom:20, left:40 },
    width = 1800 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom,
    xScale = d3.scale.linear().range([0, width]),
    yScale = d3.scale.linear().range([height - 60, 0]),
    colorScale = d3.scale.category10();

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var xAxis = d3.svg.axis()
    .scale(xScale)
    .ticks(20)
    .tickSubdivide(true)
    .tickSize(6, 3, 0)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(20)
    .tickSubdivide(true)
    .tickSize(6, 3, 0)
    .orient("left");

// Group that will contain all the nodes
var groups = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "nodes");

// Read the data
d3.csv("leg_28.csv", function(data) {
    // Sort data alphabetically by cluster, so that the colors match with legend
    data.sort(function(a, b) { return d3.ascending(a.unitCluster, b.unitCluster); });
    console.log(data);

    xScale.domain([-0.5, 0.6]);
    yScale.domain([-0.5, 0.5]);

    var shapeRadius = 30;
    var largerRadius = 100;

    // Set the background borders according to their locations
    var borders = groups.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "border")
        .attr({
            x: function(d) { return xScale(+d.x) - shapeRadius - 1; },
            y: function(d) { return yScale(+d.y) - shapeRadius - 1; },
            width: 2 * shapeRadius + 2,
            height: 2 * shapeRadius + 2
        })
        .attr("stroke-width", "1.5px")
        .attr("stroke", function(d) { return colorScale(d.unitCluster); })
        .style("fill", "#FFFFFF")
        .style("opacity", 0.1);

    // Style the nodes
    var nodes = groups.selectAll("image")
        .data(data)
        .enter()
        .append("image")
        .attr("class", "node")
        .style("opacity", 0.5)
        .style("cursor", "pointer")
        .attr("xlink:href", function(d){
            return "images/leg_28_vis/" + d.unitName + ".png";
        })
        .attr({
            x: function(d) { return xScale(+d.x) - shapeRadius; },
            y: function(d) { return yScale(+d.y) - shapeRadius; },
            width: 2 * shapeRadius,
            height: 2 * shapeRadius,
            id: function(d) { return d.unitName; }
        })
        .style("fill", function(d) { return colorScale(d.unitCluster) });

    // Mouse over a node
    var mouseOn = function() {
        var selectedNode = d3.select(this);
        // Transition to increase size/opacity of bubble
        selectedNode.transition()
            .duration(200)
            .style("opacity", 1)
            .attr({
                x: function(d) { return xScale(+d.x) - largerRadius; },
                y: function(d) { return yScale(+d.y) - largerRadius; },
                width: 2 * largerRadius,
                height: 2 * largerRadius
            });

        // Append lines to bubbles that will be used to show the precise data points.
        // Vertical line
        svg.append("g")
            .attr("class", "guide")
            .append("line")
            .attr("x1", +selectedNode.attr("x") + shapeRadius)
            .attr("y1", +selectedNode.attr("y") + shapeRadius)
            .attr("x2", +selectedNode.attr("x") + shapeRadius)
            .attr("y2", height - margin.top - margin.bottom)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("stroke", selectedNode.style("fill"))
            .transition().delay(100).duration(200)
            .style("opacity", 0.6);

        // Horizontal line
        svg.append("g")
            .attr("class", "guide")
            .append("line")
            .attr("x1", +selectedNode.attr("x") + shapeRadius)
            .attr("y1", +selectedNode.attr("y") + shapeRadius)
            .attr("x2", 0)
            .attr("y2", +selectedNode.attr("y") + shapeRadius)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("stroke", selectedNode.style("fill"))
            .transition().delay(100).duration(200)
            .style("opacity", 0.6);

        // In case another node overlaps it
        d3.selection.prototype.moveToFront = function() {
            return this.each(function() {
                this.parentNode.appendChild(this);
            });
        };
    };

    // Move out a node
    var mouseOff = function() {
        var node = d3.select(this);
        // Go back to original size and opacity
        node.transition()
            .duration(200)
            .style("opacity", 0.5)
            .ease("elastic")
            .attr({
                x: function(d) { return xScale(+d.x) - shapeRadius; },
                y: function(d) { return yScale(+d.y) - shapeRadius; },
                width: 2 * shapeRadius,
                height: 2 * shapeRadius
            });

        // Fade out guide lines, then remove
        d3.selectAll(".guide")
            .transition().duration(100)
            .style("opacity", 0.5)
            .remove()
    };

    // Run the mouseOn/Off functions
    nodes.on("mouseover", mouseOn);
    nodes.on("mouseout", mouseOff);

    // Tooltips (using jQuery plugin tipsy)
    nodes.append("title")
        .text(function(d) { return d.unitName; });

    $(".node").tipsy({ gravity: 's', offset: 15});

    // Array of the clusters, used for the legend, range [1, maxClusterNumber]
    var maxClusterNumber = d3.max(data, function(d) { return +d.unitCluster; });
    var clusters = new Array(maxClusterNumber);
    for (var i = 0; i < maxClusterNumber; ++i) {
        clusters[i] = String(i + 1);
    }
    //var clusters = new Array("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14" );

    // Legend colors
    svg.append("g")
        .attr("class", "legend")
        .selectAll("rect")
        .data(clusters)
        .enter().append("rect")
        .attr({
            x: function(d, i) { return (40 + i * 80); },
            y: height,
            width: 40,
            height: 12
        })
        .style("fill", function(d) { return colorScale(d); });


    // Legend labels
    svg.select(".legend")
        .selectAll("text")
        .data(clusters)
        .enter().append("text")
        .attr({
            x: function(d, i) { return (40 + i * 80); },
            y: height + 24
        })
        .text(function(d) { return d; });

    // Draw axes
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + "," + (height - 60 + margin.top) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis);
});
