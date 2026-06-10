//script file for Chart 2: Grouped Demographic Bar Chart
function drawDemographicBarChart(demoData) {
    // 1. Data Processing: Aggregate data into combinations of Age Group and Sex
    const rolled = d3.rollups(
        demoData,
        v => d3.sum(v, d => d.hospitalisations),
        d => d.ageGroup,
        d => d.sex
    );

    // Reshape the raw aggregated rows into a flat structure that D3 layout maps accept easily
    const ageGroupsSet = new Set();
    const processedData = rolled.map(([ageGroup, sexGroup]) => {
        ageGroupsSet.add(ageGroup);
        const entry = { ageGroup: ageGroup, Male: 0, Female: 0 };
        sexGroup.forEach(([sex, total]) => {
            const lowerSex = sex.toLowerCase();
            if (lowerSex.includes("mal") && !lowerSex.includes("fe")) entry.Male = total;
            if (lowerSex.includes("fe")) entry.Female = total;
        });
        return entry;
    });

    // Custom sort to cleanly list age ranges sequentially (e.g., "0-4", "5-14", "75+")
    processedData.sort((a, b) => a.ageGroup.localeCompare(b.ageGroup, undefined, { numeric: true, sensitivity: 'base' }));
    const categories = processedData.map(d => d.ageGroup);
    const subgroups = ["Male", "Female"];

    // 2. Clear out any old content inside the container slot
    const container = d3.select("#mode-bar-chart");
    container.html("");

    // Fetch card boundaries to ensure perfectly matched layouts
    const containerNode = container.node();
    const parentWidth = containerNode ? containerNode.getBoundingClientRect().width : 500;
    
    // Space layout specs matching your first line chart card setup
   const margin = { top: 40, right: 20, bottom: 55, left: 85 };
const width = (parentWidth > 0 ? parentWidth : 500) - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom; // Aligned compact height // Same 340px total vertical size

    // Build the SVG element container
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Set Up Scales (x0 for main age blocks, x1 for the twin side-by-side inner bars)
    const x0Scale = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .padding(0.25);

    const x1Scale = d3.scaleBand()
        .domain(subgroups)
        .range([0, x0Scale.bandwidth()])
        .padding(0.05);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => Math.max(d.Male, d.Female)) * 1.3]) // 30% headroom for text tags
        .range([height, 0]);

    // Themes colors matching dashboard design parameters: Clean Blue vs Coral Pink
    const colorScale = d3.scaleOrdinal()
        .domain(subgroups)
        .range(["#58a6ff", "#ff7b72"]);

    // 4. Draw Horizontal Axis (X-Axis)
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0Scale).tickPadding(8));
    
    xAxis.selectAll("text")
        .style("fill", "#8b949e")
        .style("font-size", "11px");
    xAxis.selectAll("line").style("stroke", "#30363d");
    xAxis.select(".domain").style("stroke", "#30363d");

    // 5. Draw Vertical Axis (Y-Axis)
    const yAxis = svg.append("g")
        .call(d3.axisLeft(yScale).ticks(8).tickPadding(10));
        
    yAxis.selectAll("text").style("fill", "#8b949e").style("font-size", "11px");
    yAxis.selectAll("line").style("stroke", "#30363d");
    yAxis.select(".domain").style("stroke", "#30363d");

    // 6. Structural Title Labels
    // X-Axis Title (Shifted down slightly to clear the tilted labels)
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 55)
        .attr("text-anchor", "middle")
        .style("fill", "#8b949e")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Age Groups");

    // Y-Axis Title: FIXED TO MATCH HOSPITALISATIONS DATA
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .style("fill", "#8b949e")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .text("Number of Hospitalisations");

    // 7. Bind Data and Draw Grouped Bars
    svg.append("g")
      .selectAll("g")
      .data(processedData)
      .join("g")
        .attr("transform", d => `translate(${x0Scale(d.ageGroup)}, 0)`)
      .selectAll("rect")
      .data(d => subgroups.map(key => ({ key: key, value: d[key], age: d.ageGroup })))
      .join("rect")
        .attr("x", d => x1Scale(d.key))
        .attr("y", d => yScale(d.value))
        .attr("width", x1Scale.bandwidth())
        .attr("height", d => height - yScale(d.value))
        .attr("fill", d => colorScale(d.key))
        .attr("rx", 2) // Subtle rounded top edge for a smooth look
        .style("cursor", "pointer")
        // High-Quality Interactions
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition().duration(100)
                .attr("opacity", 0.75);

            // Append exact score directly over the active bar
            svg.append("text")
                .attr("class", "bar-hint")
                .attr("x", x0Scale(d.age) + x1Scale(d.key) + x1Scale.bandwidth() / 2)
                .attr("y", yScale(d.value) - 8)
                .attr("text-anchor", "middle")
                .attr("fill", "#ffffff")
                .attr("font-size", "11px")
                .attr("font-weight", "600")
                .text(d.value.toLocaleString());
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition().duration(100)
                .attr("opacity", 1);
                
            svg.selectAll(".bar-hint").remove();
        });

    // 8. Add a Legend inside the chart canvas
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 110}, -15)`);

    subgroups.forEach((subgroup, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 18})`);
        
        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("rx", 2)
            .attr("fill", colorScale(subgroup));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 11)
            .attr("fill", "#8b949e")
            .style("font-size", "11px")
            .text(subgroup);
    });
}