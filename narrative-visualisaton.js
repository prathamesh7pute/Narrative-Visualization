
const healthWorkforce = {
    'medical_doctors': 'Medical doctors',
    'nursing_midwifery': 'Nursing and midwifery personnel',
    'dentistry_personnel': 'Dentists',
    'pharmaceutical_personnel': 'Pharmacists',
    'physiotherapy_personnel': 'Physiotherapists',
};

const cardTitleDefault = 'World';

let selectedHealthWorkforceCategory = 'medical_doctors';
let selectedDisplayDoctorsBy = 'medical_doctors_per_10000';

let selectedStartYear = null;
let selectedEndYear = null;

let medicalProffesionalsData = null;

async function displayScene(healthWorkforceCategory) {
    selectedHealthWorkforceCategory = healthWorkforceCategory;
    selectedDisplayDoctorsBy = document.getElementById("doctorsBy").value;
    selectedStartYear = null;
    selectedEndYear = null;
    // add active class to selected item
    updateNavItemClass(selectedHealthWorkforceCategory);
    await loadScene();
}

function updateScene() {
    selectedDisplayDoctorsBy = document.getElementById("doctorsBy").value;
    displayChart();
}

function updateYears(start, end) {
    selectedStartYear = start;
    selectedEndYear = end;
    displayChart();
}

function updateCountry() {
    selectedCountry = document.getElementById("country").value;
    const countries = d3.selectAll("path." + selectedCountry.replace(/\s/g, '_'));
    countries.classed('highlight', true);
}

async function loadScene() {
    healthWorkforceCategory = selectedHealthWorkforceCategory;
    // fetch data
    csv = healthWorkforceCategory + ".csv";
    medicalProffesionalsData = await d3.csv(csv);
    displayChart();
}

const displayChart = () => {

    // clear svg
    document.querySelector('#scene').innerHTML = '';

    // display chart
    const width = 925;
    const height = 550;
    const margin = 50;

    const medicalProffesionalsByCountries = getMedicalProffesionalsByCountries(medicalProffesionalsData, healthWorkforceCategory);
    const contryWisePathData = getContryWisePathData(medicalProffesionalsByCountries, selectedDisplayDoctorsBy);
    const minMaxData = getMinMaxData(medicalProffesionalsByCountries, selectedDisplayDoctorsBy);

    const startYear = selectedStartYear || minMaxData.startYear;
    const endYear = selectedEndYear || minMaxData.endYear;
    let minMedicalDoctors = minMaxData.minDoctors;
    const maxMedicalDoctors = minMaxData.maxDoctors;
    const years = d3.range(startYear, endYear);

    if (minMedicalDoctors < 1) {
        minMedicalDoctors = 0.001;
    }

    const yScale = d3.scaleLog().base(10).domain([maxMedicalDoctors, minMedicalDoctors]).range([margin, height - margin]);
    const xScale = d3.scaleLinear().domain([startYear, endYear]).range([margin, width]);

    const onmouseover = function (d, i) {
        const currClass = d3.select(this).attr("class");
        d3.select(this).attr("class", currClass + " current");

        const country = d3.select(this).attr("country");
        let sum = 0;
        d.forEach(docs => { sum += docs.y });
        const averageDocs = (sum / d.length);
        document.querySelector('.sub-details').innerHTML = `
         <p>The country <strong>${country}</strong> has on average ${averageDocs.toFixed(2)} doctors overs years.</div>`;

        const xVal = (d) => { return xScale(d.x); };
        const yVal = (d) => { return yScale(d.y); };

        d3.select(".tooltip").style("display", 'block');
        d3.select(".tooltip").transition().duration(100).style("opacity", .9);
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

        displaySubChart(d);
    };

    const onmouseout = function (d, i) {
        var currClass = d3.select(this).attr("class");
        var prevClass = currClass.substring(0, currClass.length - 8);
        d3.select(this).attr("class", prevClass);
        document.querySelector('.sub-details').innerHTML = ``;
        document.querySelector('.sub-graph').innerHTML = ``;
        chart.selectAll("circle").remove();
        d3.select(".tooltip").style("display", 'none');
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
            .attr("class", contryWisePathData[idx].country.replace(/\s/g, '_'))
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

    document.querySelector('.details').innerHTML = `<p>Chart on the right shows ${healthWorkforce[healthWorkforceCategory]} by number and per 10,000 population per year per country which helps in understanding how many doctors are there per country.</p>`;

    createCountriesSelectDropDown(medicalProffesionalsByCountries);
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

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.id === 'btn-'+id) {
            input.checked = true;
        } else {
            input.checked = false;
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

const createCountriesSelectDropDown = (medicalProffesionalsByCountries) => {
    const contryWisePathData = [];
    const keys = Object.keys(medicalProffesionalsByCountries)
    let options = `<option value="select">Select</option>`;
    keys.forEach((key) => {
        options += `<option value="${key}">${key}</option>`;
    });
    document.querySelector('#country').innerHTML = options;
};


const getMinMaxData = (medicalProffesionalsByCountries, category) => {
    let startYear = 2020;
    let endYear = 1900;
    let minDoctors = Infinity;
    let maxDoctors = 0;
    const keys = Object.keys(medicalProffesionalsByCountries)
    keys.forEach((key) => {
        medicalProffesionalsByCountries[key].forEach((data) => {
            if (data[category]) {
                if (data.year > endYear) {
                    endYear = data.year;
                }

                if (data.year < startYear) {
                    startYear = data.year;
                }
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



const displaySlider = () => {

    const years = d3.range(1930, 2020);

    const sliderRange = d3
        .sliderBottom()
        .min(d3.min(years))
        .max(d3.max(years))
        .width(300)
        .tickFormat(d3.format('d'))
        .ticks(5)
        .default([years[0], years[years.length - 1]])
        .fill('#2196f3')
        .on('onchange', val => {
            updateYears(d3.format("d")(+val[0]), d3.format("d")(+val[1]));
        });

    const gRange = d3
        .select('#slider')
        .append('svg')
        .attr('width', 400)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gRange.call(sliderRange);
}


const displaySubChart = (data) => {

    console.log(data);

    //sort bars based on value
    data = data.sort(function (a, b) {
        return a.x - b.x;
    })

    //set up svg using margin conventions - we'll need plenty of room on the left for labels
    var margin = {
        top: 10,
        right: 15,
        bottom: 10,
        left: 40
    };

    var width = 200 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select(".sub-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // set the ranges
    var y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1);

    var x = d3.scaleLinear()
        .range([0, width]);

    x.domain([0, d3.max(data, function (d) { return d.y; })])
    y.domain(data.map(function (d) { return d.x; }));

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        //.attr("x", function(d) { return x(d.sales); })
        .attr("width", function (d) { return x(d.y); })
        .attr("y", function (d) { return y(d.x); })
        .attr("height", y.bandwidth());

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
}