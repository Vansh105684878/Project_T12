// Dedicated script file for Chart 1: Single Decadal Trend Line Chart
function drawInjuryLineChart(crashData) {
    // 1. Data Processing: Aggregating all rows into a single grand total per year
    const yearlyTotals = d3.rollups(
        crashData,
        v => d3.sum(v, d => d.hospitalisations),
        d => d.calendarYear
    )
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year - b.year);

    // 2. Clear out the old container slot
    const container = d3.select("#injury-line-chart");
    container.html(""); 

    // Dynamically fetch width from your HTML card wrapper
    const containerNode = container.node();
    const parentWidth = containerNode ? containerNode.getBoundingClientRect().width : 500;

    // Dimensions: Adjusted left margin to 85 and bottom to 60 to give axis titles room to breathe!
   const margin = { top: 30, right: 35, bottom: 50, left: 85 }; 
const width = (parentWidth > 0 ? parentWidth : 500) - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom; // Clean compact height

    // Build the SVG container
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Set up chart scaling maps
    const xScale = d3.scaleLinear()
        .domain(d3.extent(yearlyTotals, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(yearlyTotals, d => d.total) * 1.4]) // Centered headroom
        .range([height, 0]);

    // 4. Draw horizontal structural axis (X-Axis)
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(yearlyTotals.length || 5).tickPadding(8));
    
    xAxis.selectAll("text").style("fill", "#8b949e").style("font-size", "11px");
    xAxis.selectAll("line").style("stroke", "#30363d");
    xAxis.select(".domain").style("stroke", "#30363d");

    // 5. Draw vertical structural axis with tick padding (Y-Axis)
    const yAxis = svg.append("g")
        .call(d3.axisLeft(yScale).ticks(10).tickPadding(10));
        
    yAxis.selectAll("text").style("fill", "#8b949e").style("font-size", "11px");
    yAxis.selectAll("line").style("stroke", "#30363d");
    yAxis.select(".domain").style("stroke", "#30363d");

    // ==========================================
    // NEW ACCESSIBILITY FEATURE: AXIS LABELS
    // ==========================================
    
    // X-Axis Title: "Years"
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45) // Placed safely below the year numbers
        .attr("text-anchor", "middle")
        .style("fill", "#8b949e")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Years");

    // Y-Axis Title: "Number of Deaths"
    svg.append("text")
        .attr("transform", "rotate(-90)") // Rotated to run vertically along the axis
        .attr("x", -height / 2)
        .attr("y", -60) // Positioned to the left of the axis tick numbers
        .attr("text-anchor", "middle")
        .style("fill", "#8b949e")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Number of Deaths");

    // 6. Build the trend line path generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.total))
        .curve(d3.curveMonotoneX);

    // Render the single total injury line path matching your bright blue accent
    svg.append("path")
        .datum(yearlyTotals)
        .attr("fill", "none")
        .attr("stroke", "#58a6ff") 
        .attr("stroke-width", 3)
        .attr("d", lineGenerator);

    // 7. Interactive Focal Tracker Element (Hover Dot + Text labels)
    const focusCircle = svg.append("circle")
        .attr("r", 6)
        .attr("fill", "#58a6ff")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .style("opacity", 0);

    const focusText = svg.append("text")
        .attr("fill", "#f0f6fc")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("text-anchor", "middle")
        .attr("dy", "-15px")
        .style("opacity", 0);

    // Invisible mouse overlay surface to capture pointer movements
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
            focusCircle.style("opacity", 1);
            focusText.style("opacity", 1);
        })
        .on("mousemove", function(event) {
            const mouseX = d3.pointer(event)[0];
            const xValue = Math.round(xScale.invert(mouseX));
            
            const bisect = d3.bisector(d => d.year).left;
            const idx = bisect(yearlyTotals, xValue);
            
            let d = yearlyTotals[idx];
            if (idx > 0 && (idx >= yearlyTotals.length || Math.abs(xValue - yearlyTotals[idx-1].year) < Math.abs(xValue - d.year))) {
                d = yearlyTotals[idx-1];
            }

            if (d) {
                focusCircle.attr("cx", xScale(d.year)).attr("cy", yScale(d.total));
                focusText.attr("x", xScale(d.year)).attr("y", yScale(d.total) - 5)
                    .text(`${d.year}: ${d.total.toLocaleString()} cases`);
            }
        })
        .on("mouseout", () => {
            focusCircle.style("opacity", 0);
            focusText.style("opacity", 0);
        });
}