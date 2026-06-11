// Dedicated script file for Chart 4: Interactive Lollipop Chart
function drawCauseLollipopChart(crashData) {
    console.log("Initializing Lollipop Chart with Axis Labels and Tips Hover. Rows:", crashData.length);

    // 1. Target container check
    const container = d3.select("#injury-lollipop-chart");
    if (container.empty()) {
        console.error("Error: HTML container '#injury-lollipop-chart' not found.");
        return;
    }
    container.html(""); // Clear old rendering layers

    // 2. Data Processing: Aggregate hospitalisations by category
    const rolled = d3.rollups(
        crashData,
        v => d3.sum(v, d => d.hospitalisations),
        d => d.roadUser 
    );

    // Map and sort from highest cases to lowest cases
    let chartData = rolled.map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

    // Filter out blank categories
    chartData = chartData.filter(d => d.category && d.category.trim() !== "" && d.total > 0);

    // 3. Layout Dimensions & Spanning Margins (Heavily expanded left/bottom for axis text layout)
    const containerNode = container.node();
    const parentWidth = containerNode ? containerNode.getBoundingClientRect().width : 500;
    
    const margin = { top: 20, right: 30, bottom: 95, left: 110 }; 
    const width = (parentWidth > 0 ? parentWidth : 500) - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    // 4. Create base SVG space workspace canvas
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 5. Scales & Grid Configurations
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.category))
        .range([0, width])
        .padding(1); 

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.total) * 1.1]) 
        .range([height, 0]);

    // 6. Draw Grid Lines & Axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
        
    xAxis.selectAll("text")
        .attr("transform", "translate(-12, 12)rotate(-35)") 
        .style("text-anchor", "end")
        .style("fill", "#8b949e")
        .style("font-size", "11px");

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")));
        
    yAxis.selectAll("text")
        .style("fill", "#8b949e")
        .style("font-size", "11px");

    // Remove harsh axis outer border lines and style tick indicators
    svg.selectAll(".domain").style("stroke", "#30363d");
    svg.selectAll(".tick line").style("stroke", "#30363d");

    // 7. Axis Titles
    // X-Axis Title
    svg.append("text")
        .attr("class", "x-axis-title")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 85) 
        .style("fill", "#c9d1d9")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Type of Vehicle");

    // Y-Axis Title
    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -75) 
        .style("fill", "#c9d1d9")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Number of Deaths");

    // 8. Draw Lollipop Sticks (Lines)
    svg.selectAll("myline")
        .data(chartData)
        .join("line")
          .attr("x1", d => x(d.category))
          .attr("x2", d => x(d.category))
          .attr("y1", height)
          .attr("y2", d => y(d.total))
          .attr("stroke", "#388bfd") 
          .attr("stroke-width", 2);

    // 9. Create a Single Floating Tooltip HTML Element inside the container
    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#161b22")
        .style("color", "#ffffff")
        .style("border", "1px solid #30363d")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.5)")
        .style("pointer-events", "none")
        .style("z-index", "100");

    // 10. Draw Lollipop Candy Heads (Circles) with full interactive hover events
    const circles = svg.selectAll("mycircle")
        .data(chartData)
        .join("circle")
          .attr("cx", d => x(d.category))
          .attr("cy", d => y(d.total))
          .attr("r", 6)
          .attr("fill", "#58a6ff")
          .attr("stroke", "#0d1117") 
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer");

    // Bind interaction engines to the tips
    circles.on("mouseover", function(event, d) {
        d3.select(this)
            .transition().duration(100)
            .attr("r", 9) // Expanded tip size on pointer focus
            .attr("fill", "#f0883e"); // Vibrant highlighting color swap
            
        tooltip.style("visibility", "visible")
            .html(`<strong>${d.category}</strong><br/>Exact Deaths: <span style='color:#58a6ff; font-weight:bold;'>${d.total.toLocaleString()}</span>`);
    })
    .on("mousemove", function(event) {
        // Track mouse movement inside the relative layout block cleanly
        const [mouseX, mouseY] = d3.pointer(event, container.node());
        tooltip.style("top", (mouseY - 50) + "px") // Positions perfectly floating right above your cursor arrow
               .style("left", (mouseX + 15) + "px");
    })
    .on("mouseout", function() {
        d3.select(this)
            .transition().duration(100)
            .attr("r", 6) // Smooth reset back to normal circle size
            .attr("fill", "#58a6ff"); // Return color smoothly back to theme blue
            
        tooltip.style("visibility", "hidden"); // Hide card layout completely
    });

    console.log("Lollipop Tips Hover Processing Completed.");
}