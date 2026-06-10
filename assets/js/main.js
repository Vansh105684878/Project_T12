// ==========================================
// 1. DATA LOADING PIPELINE
// ==========================================

// Loader for Chart 1, 3 & 4 (Trends, Vehicle Breakdown, and Lollipop Categories)
function loadCrashData() {
    return d3.text("assets/data/cleaned trends by vehicle.csv")
        .then(rawText => {
            const parsedData = d3.csvParse(rawText);
            return parsedData.map(d => {
                const yearKey = Object.keys(d).find(k => k.toLowerCase().includes("year"));
                const userKey = Object.keys(d).find(k => k.toLowerCase().includes("user"));
                const countKey = Object.keys(d).find(k => k.toLowerCase().includes("hospitalisations") || k.toLowerCase().includes("sum"));

                let finalYear = null;
                if (yearKey && d[yearKey]) {
                    const rawYearStr = d[yearKey].trim();
                    if (rawYearStr.includes("-")) {
                        finalYear = +rawYearStr.split("-")[0];
                    } else {
                        finalYear = +rawYearStr;
                    }
                }
                return {
                    calendarYear: finalYear,
                    roadUser: userKey ? d[userKey] : "Unknown",
                    hospitalisations: countKey ? +d[countKey] : 0
                };
            }).filter(d => d.calendarYear !== null && !isNaN(d.calendarYear));
        });
}

// Loader for Chart 2 (Age and Sex Demographics)
function loadDemographicData() {
    return d3.text("assets/data/cleaned age and sex.csv")
        .then(rawText => {
            const parsedData = d3.csvParse(rawText);

            return parsedData.map(d => {
                const ageKey = Object.keys(d).find(k => k.toLowerCase().includes("age"));
                const sexKey = Object.keys(d).find(k => k.toLowerCase().includes("sex") || k.toLowerCase().includes("gender"));
                const countKey = Object.keys(d).find(k => k.toLowerCase().includes("hospitalisations") || k.toLowerCase().includes("sum"));

                return {
                    ageGroup: ageKey ? d[ageKey].trim() : "Unknown",
                    sex: sexKey ? d[sexKey].trim() : "Unknown",
                    hospitalisations: countKey ? +d[countKey] : 0
                };
            }).filter(d => 
                d.ageGroup !== "Unknown" && 
                d.ageGroup !== "" && 
                d.ageGroup !== "." &&             
                d.ageGroup.replace(/\s+/g, '') !== "" 
            );
        })
        .catch(error => {
            console.error("Error loading cleaned age and sex.csv from assets/data:", error);
        });
}

// ==========================================
// 2. MASTER COORDINATION PIPELINE
// ==========================================
Promise.all([
    loadCrashData(),
    loadDemographicData()
]).then(([crashData, demographicData]) => {
    
    console.log("Data Loader Engine Finished Tasking.");

    // Render Chart 1 (Line Chart)
    if (document.getElementById("injury-line-chart") && crashData && crashData.length > 0) {
        drawInjuryLineChart(crashData);
    }

    // Render Chart 2 (Grouped Bar Chart)
    if (document.getElementById("mode-bar-chart") && demographicData && demographicData.length > 0) {
        drawDemographicBarChart(demographicData);
    }

    // Render Chart 3 (Pie/Donut Slot Fallback Container Check)
    if (document.getElementById("class-pie-chart") && crashData && crashData.length > 0) {
        drawRoadUserDonutChart(crashData);
    }

    // Render Chart 4 (Lollipop Chart with full Tips hover functionality)
    if (document.getElementById("injury-lollipop-chart") && crashData && crashData.length > 0) {
        drawCauseLollipopChart(crashData);
    }
}).catch(err => {
    console.error("Master Orchestrator failed during execution sequence:", err);
});