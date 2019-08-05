
const healthWorkforce = {
    'medical_doctors': 'Medical doctors',
    'nursing-midwifery': 'Nursing and midwifery personnel',
};

const cardTitleDefault = 'World';

let selectedHealthWorkforceCategory = 'medical_doctors';
let selectedDisplayDoctorsBy = 'medical_doctors_per_10000';

async function displayScene(healthWorkforceCategory) {
    selectedHealthWorkforceCategory = healthWorkforceCategory;
    selectedDisplayDoctorsBy = document.getElementById("doctorsBy").value;
    await loadScene();
}

async function updateScene() {
    selectedDisplayDoctorsBy = document.getElementById("doctorsBy").value;
    await loadScene();
}

async function loadScene() {
    healthWorkforceCategory = selectedHealthWorkforceCategory;

    // clear svg
    document.querySelector('#scene').innerHTML = '';

    // add active class to selected item
    updateNavItemClass(selectedHealthWorkforceCategory);
    
    // fetch data
    csv = healthWorkforceCategory + ".csv";
    const medicalProffesionalsData = await d3.csv(csv);

    // display chart
    const width = 925;
    const height = 550;
    const margin = 50;

    const medicalProffesionalsByCountries = getMedicalProffesionalsByCountries(medicalProffesionalsData, healthWorkforceCategory);
    const contryWisePathData = getContryWisePathData(medicalProffesionalsByCountries, selectedDisplayDoctorsBy);
    const minMaxData = getMinMaxData(medicalProffesionalsByCountries, selectedDisplayDoctorsBy);

    const startYear = minMaxData.startYear;
    const endYear = minMaxData.endYear;
    let minMedicalDoctors = minMaxData.minDoctors;
    const maxMedicalDoctors = minMaxData.maxDoctors;

    if(minMedicalDoctors < 1) {
        minMedicalDoctors = 0.1;
    } 

    const yScale = d3.scaleLog().base(10).domain([maxMedicalDoctors, minMedicalDoctors]).range([margin, height - margin]);
    const xScale = d3.scaleLinear().domain([startYear, endYear]).range([margin, width]);

    const onmouseover = function (d, i) {
        const currClass = d3.select(this).attr("class");
        d3.select(this).attr("class", currClass + " current");

        const country = d3.select(this).attr("country");
        // document.querySelector('.card-title').innerText = `${country}`;
        let sum = 0;
        d.forEach(docs => { sum += docs.y });
        const averageDocs = (sum / d.length);
        // document.querySelector('.card-text').innerHTML = `
        // <p>The country <strong>${country}</strong> has expenditure of <strong>$${d[0].y}</strong> 
        // in year <strong>${d[0].x}</strong> and <strong>$${d[15].y}</strong> in <strong>${d[15].x}</strong>
        // which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage<p>`;

        const xVal = (d) => { return xScale(d.x); };
        const yVal = (d) => { return yScale(d.y); };

        d3.select(".tooltip").transition().duration(100).style("opacity", .9)
        d3.select(".tooltip")
            .html(`<div>${country} has on average ${averageDocs.toFixed(2)} doctors overs years.</div>`)
            .style("top", (d3.event.pageY + 20) + "px")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("position", "absolute");

        const dots = chart.selectAll("circle")
            .data(d)
            .enter()
            .append("circle")
            .attr("r", 2)
            .attr("cx", xVal)
            .attr("cy", yVal)
            .style("stroke", function (d) {
                return '#be1932';
            })
            .style("fill", function (d) {
                return 'white';
            });
    };

    const onmouseout = function (d, i) {
        var currClass = d3.select(this).attr("class");
        var prevClass = currClass.substring(0, currClass.length - 8);
        d3.select(this).attr("class", prevClass);
        
        // const average = ((worldExpenditureEndYear - worldExpenditureStartYear) / worldExpenditureStartYear) * 100;
        // document.querySelector('.card-title').innerText = `World`;
        // document.querySelector('.card-text').innerHTML = `
        // <p><strong>World</strong> has expenditure of <strong>${worldExpenditureStartYear.toFixed(2)}</strong> 
        // in year <strong>2000</strong> and <strong>$${worldExpenditureEndYear.toFixed(2)}</strong> in <strong>2015</strong>
        // which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage</p>`;
        chart.selectAll("circle").remove();
    };

    const chart = d3.select("#scene")
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append("g");

    const line = d3.line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

    contryWisePathData.forEach((data, idx) => {
        chart.append("path")
            .data([contryWisePathData[idx].pathData])
            .attr("country", contryWisePathData[idx].country)
            .attr("d", line)
            .on("mouseover", onmouseover)
            .on("mouseout", onmouseout);
    });

    chart.append("line")
        .attr("x1", xScale(startYear))
        .attr("y1", yScale(minMedicalDoctors))
        .attr("x2", xScale(endYear))
        .attr("y2", yScale(minMedicalDoctors))
        .attr("class", "axis");

    chart.append("line")
        .attr("x1", xScale(startYear))
        .attr("y1", yScale(minMedicalDoctors))
        .attr("x2", xScale(startYear))
        .attr("y2", yScale(maxMedicalDoctors))
        .attr("class", "axis");

    chart.selectAll(".xLabel")
        .data(xScale.ticks(5))
        .enter().append("text")
        .attr("class", "xLabel")
        .text(String)
        .attr("x", function (d) { return xScale(d) })
        .attr("y", height - 10)
        .attr("text-anchor", "middle");

    chart.selectAll(".yLabel")
        .data(yScale.ticks(4))
        .enter().append("text")
        .attr("class", "yLabel")
        .text(String)
        .attr("x", 0)
        .attr("y", function (d) { return yScale(d) })
        .attr("text-anchor", "right")
        .attr("dy", 3);

    chart.selectAll(".xTicks")
        .data(xScale.ticks(5))
        .enter().append("line")
        .attr("class", "xTicks")
        .attr("x1", function (d) { return xScale(d); })
        .attr("y1", yScale(minMedicalDoctors))
        .attr("x2", function (d) { return xScale(d); })
        .attr("y2", yScale(minMedicalDoctors) + 7);

    chart.selectAll(".yTicks")
        .data(yScale.ticks(4))
        .enter().append("line")
        .attr("class", "yTicks")
        .attr("y1", function (d) { return yScale(d); })
        .attr("x1", xScale(startYear - 0.4))
        .attr("y2", function (d) { return yScale(d); })
        .attr("x2", xScale(startYear));

    chart.append("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 30)
        .text("Year");

    chart.append("text")
        .attr("class", "ylabel")
        .attr("text-anchor", "start")
        .attr("x", -60)
        .attr("y", 45)
        .attr("transform", "rotate(-90)")
        .text("Doctors");

    // document.querySelector('.card-title').innerText = `World`;
    // const average = ((worldExpenditureEndYear - worldExpenditureStartYear) / worldExpenditureStartYear) * 100;
    // document.querySelector('.card-text').innerHTML = `
    //     <p><strong>World</strong> has expenditure of <strong>${worldExpenditureStartYear.toFixed(2)}</strong> 
    //     in year <strong>2000</strong> and <strong>$${worldExpenditureEndYear.toFixed(2)}</strong> in <strong>2015</strong>
    //     which implies ${average > 0 ? 'increase' : 'decrease'} of <strong>${average.toFixed(2)}</strong> percentage</p>`;

}

const updateNavItemClass = (id) => {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.id === id) {
            link.classList.add('active')
        } else {
            link.classList.remove('active');
        }
    });

}

const getMedicalProffesionalsByCountries = (medicalProffesionalsData, healthWorkforceCategory) => {
    const medicalProffesionalsByCountries = {};
    medicalProffesionalsData.forEach((data, idx) => {
        if (!medicalProffesionalsByCountries[data.Country]) {
            medicalProffesionalsByCountries[data.Country] = []
        } else {
            medicalProffesionalsByCountries[data.Country].push({
                year: +data.Year,
                medical_doctors_by_number: +data[`${healthWorkforce[healthWorkforceCategory]} (number)`],
                medical_doctors_per_10000: +data[`${healthWorkforce[healthWorkforceCategory]} (per 10 000 population)`],
            });
        }
    });
    return medicalProffesionalsByCountries;
};

const getContryWisePathData = (medicalProffesionalsByCountries, category) => {
    const contryWisePathData = [];
    const keys = Object.keys(medicalProffesionalsByCountries)
    keys.forEach((key) => {
        const pathData = [];
        medicalProffesionalsByCountries[key].forEach((data) => {
            pathData.push({ x: data.year, y: data[category] });
        });
        contryWisePathData.push({
            pathData: pathData,
            country: key
        });
    });
    return contryWisePathData;
};

const getMinMaxData = (medicalProffesionalsByCountries, category) => {
    let startYear = 2020;
    let endYear = 1900;
    let minDoctors = Infinity;
    let maxDoctors = 0;
    const keys = Object.keys(medicalProffesionalsByCountries)
    keys.forEach((key) => {
        medicalProffesionalsByCountries[key].forEach((data) => {
            if (data.year > endYear) {
                endYear = data.year;
            }

            if (data.year < startYear) {
                startYear = data.year;
            }

            if (data[category] > maxDoctors) {
                maxDoctors = data[category];
            }

            if (data[category] < minDoctors) {
                minDoctors = data[category];
            }
        });
    });

    return {
        startYear: startYear,
        endYear: endYear,
        minDoctors: minDoctors,
        maxDoctors: maxDoctors,
    }
};


// loop through data
