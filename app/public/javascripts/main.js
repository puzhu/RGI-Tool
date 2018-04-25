//INITIALIZE CHART STATE VARS
// const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: {indexScore: "ascending", valueRealization: "ascending", revenueManagement: "ascending", enablingEnvironment: "ascending"},}
const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: "ascending",}

const countryBlurbInitial = `
  <div class="col-md-12 sticky-top" id="dynamicTitle">
    <h5>Click on a country to view profile</h5>
  </div>
  <div class="col-md-12" id="dynamicBlurb">
    <p class="explainer">The chart to the left shows the scores (overall and component) for the 2017 RGI. By default the chart is sorted by the overall score. Use the panel headers to change the default sort settings.</p>
    <p class="explainer">In addition to the sorting, you can also click on individual rows to lock them (one at a time). This in combination with sorting will allow you to visually observe a country's relative performance 
    across different index components. Finally, locking a country also will show more detailed information about each country that you can manipulate.</p>
  </div>
`
/**
 * Check an function argument
 * @function required
 * @returns {Error}
 * @description returns an error if an argument is missing from a function
 */
const required = () => {throw new Error("Missing a required input")};

/**
 * Generates an SVG
 * @function createSVG
 * @param {string} id - The id of the chart element to append SVG to.
 * @param {object} margin - The top, bottom, right and left margins.
 * @returns {object}
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */
const createSVG = (id = required(), margin = {top: 5, right: 5, bottom: 5, left: 5}) => { //plotVar, margin, padding
  const outerWidth = d3.select(id).node().clientWidth,
    outerHeight = d3.select(id).node().clientHeight,
    width = outerWidth - (margin.left + margin.right),
    height = outerHeight - (margin.top + margin.bottom),
    plotVar = d3.select(id).append('svg')
        .attr('width', outerWidth)
        .attr('height', outerHeight)
      .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  return {width, height, plotVar}
}

/**
 * Render the initial view
 * @function renderInitialView
 * @param {string} countryBlurbInitial - The initial text to be appended to the country blurb section
 * @description given a set of template strings render the initial views
 */

const renderInitialView = (countryBlurbInitial) => {
  const countryBlurbEl = document.querySelector("#countryBlurb")
  while(countryBlurbEl.firstChild){
    countryBlurbEl.removeChild(countryBlurbEl.firstChild);
  }

  countryBlurbEl.innerHTML = countryBlurbInitial;
}

const renderCountryBlurb = (country, alias, sector) => {
  const countryBlurbEl = document.querySelector("#countryBlurb")
  while(countryBlurbEl.firstChild){
    countryBlurbEl.removeChild(countryBlurbEl.firstChild);
  }
  const countryBlurb = `
    <div class="col-md-12 sticky-top" id="dynamicTitle">
      <h5>${country.concat(sector).length < 34 ? country : alias} - ${sector} sector</h5>
    </div>
  `
  countryBlurbEl.innerHTML = countryBlurb;
}
/**
 * Compute the scores of different countries for the index, component and subcomponents
 * @function computeScores
 * @param {object} indicatorScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given the indicatorScores for each country compute the overall rank position for each country
 */

const computeScores = (indicatorScores = required()) => {
  
  //Find the unique set of country sector combos
  const countrySectorList = [...new Set(indicatorScores.map(d => (d.country).concat("?").concat(d.sector)))];

  //initiate vars
  let sector,
    country,
    subComponentScores,
    componentScores;

  //Loop through each combo
  const countryScores = countrySectorList.reduce((accum, combo) => {
    //get the country
    country = combo.split("?")[0]

    //get the sector
    sector = combo.split("?")[1]

    //get the country data for current sector
    let countryData = indicatorScores.filter((d) => {return d.country === country && d.sector === sector})

    //calculate the subComponent scores
    subComponentScores = [...new Set(countryData.map(d => d.subComponent))].reduce((out, subComponent) => {
      //find the data relevant to this subcomponent
      let scores = countryData.filter((d) => d.subComponent === subComponent);

      //calculate the average score
      let average = scores.map(d => parseFloat(d.score))
        .reduce((sum, val) => sum + val, 0)/scores.length;

      //find the component
      let component = scores[0].component //since each subcomponents are mapped to a distinct component

      //push to the accumulator
      out.push({subComponent, score: average, component})

      return out;
    }, [])

    //calculate the component scores
    componentScores = [...new Set(subComponentScores.map(d => d.component))].reduce((out, component) => {
      //find the scores
      let scores = subComponentScores.filter(d => d.component === component);

      //calculate the average
      let average = scores.map(d => d.score)
        .reduce((sum, val) => sum + val, 0)/scores.length

      out.push({component, score: average});

      return out;
    }, [])

    //index score
    let indexScore = componentScores.reduce((sum, d) => sum + d.score, 0)/3

    //add the new data
    accum.push({country, sector, subComponentScores, componentScores, indexScore})//Object.assign({}, accum, {country: country})

    return accum;
  }, [])

  // const ranked = countryScores.sort((a, b) => b.indexScore - a.indexScore)
  //   .reduce((accum, val, i) => {
  //     accum.push(Object.assign(val, {alias: countryNames.filter((d) => d.country === val.country)[0].alias, rank: i + 1,}))

  //     return accum;
  //   }, [])

  return countryScores
}

/**
 * Extract data for the panel (indexScore and component scores)
 * @function panelData
 * @param {object} countryScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given the countryScores extract the index and component scores along with rank for plotting
 */

const computePanelData = (countryScores = required(), countryNames = required()) => {
  return countryScores.reduce((accum, score, i) => {
    accum.push({
      country: score.country,
      sector: score.sector,
      alias: countryNames.filter((d) => d.country === score.country)[0].alias,
      valueRealization: score.componentScores.filter(d => d.component === "Value extraction")[0].score,
      revenueManagement: score.componentScores.filter(d => d.component === "Revenue management")[0].score,
      enablingEnvironment: score.componentScores.filter(d => d.component === "Enabling environment")[0].score,
      indexScore: score.indexScore,
    })

    return accum
  }, [])

}


/**
 * Compute the ranks of different countries for the index, component and subcomponents
 * @function computeScores
 * @param {object} countryScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @param {object} level - This can be either be index, component or subComponent
 * @description given the indicatorScores for each country compute the overall rank position for each country
 */
const computeRanks = (panelData = required(), rankVar = "indexScore", sortDirection = "ascending") => {
  
  //sort based on arguements
  let ranked = sortDirection === "ascending" ? panelData.sort((a, b) => {return b[rankVar] - a[rankVar]}) : panelData.sort((a, b) => {return a[rankVar] - b[rankVar]})

  //update the rank
  ranked.forEach((d, i) => {d.rank = i + 1})

  return ranked
}


const panelUpdate = (yLabels, panelData, xScale, yScale, colorScale) => {
    //SET: update the labels
    yLabels.data(panelData)

    //SET: Update all the label elements
    yLabels.selectAll(".labelText")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank))

    yLabels.selectAll(".sectorIcons")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank) - 2)

    yLabels.selectAll(".lockIcons")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank) - 2)

    //SET: Update all the bars
    d3.selectAll(".indexBars")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank))
        .attr("width", d => xScale(d.indexScore))
        .attr("fill", d => colorScale(d.indexScore))
    d3.selectAll(".indexText")
        .transition()
        .duration(500)
        .attr("x", d => xScale(d.indexScore))
        .attr("y", d => yScale(d.rank))
        .text(d => Math.round(d.indexScore))
        .attr("text-anchor", d => xScale(d.indexScore) < 9 ? "start" : "end")

    d3.selectAll(".valueBars")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank))
        .attr("width", d => xScale(d.valueRealization))
        .attr("fill", d => colorScale(d.valueRealization))
    d3.selectAll(".valueText")
        .transition()
        .duration(500)
        .attr("x", d => xScale(d.valueRealization))
        .attr("y", d => yScale(d.rank))
        .text(d => Math.round(d.valueRealization))
        .attr("text-anchor", d => xScale(d.valueRealization) < 9 ? "start" : "end")

    d3.selectAll(".revenueBars")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank))
        .attr("width", d => xScale(d.revenueManagement))
        .attr("fill", d => colorScale(d.revenueManagement))
    d3.selectAll(".revenueText")
        .transition()
        .duration(500)
        .attr("x", d => xScale(d.revenueManagement))
        .attr("y", d => yScale(d.rank))
        .text(d => Math.round(d.revenueManagement))
        .attr("text-anchor", d => xScale(d.revenueManagement) < 9 ? "start" : "end")

    d3.selectAll(".enablingBars")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.rank))
        .attr("width", d => xScale(d.enablingEnvironment))
        .attr("fill", d => colorScale(d.enablingEnvironment))

    d3.selectAll(".enablingText")
        .transition()
        .duration(500)
        .attr("x", d => xScale(d.enablingEnvironment))
        .attr("y", d => yScale(d.rank))
        .text(d => Math.round(d.enablingEnvironment))
        .attr("text-anchor", d => xScale(d.enablingEnvironment) < 9 ? "start" : "end")

    //SET: update the lock icon
    // labelOnClick({rank: stateVars.lockedRank})
    // console.log(stateVars.lockedRank)
    // if(stateVars.lockedRank !== 0){
    //   d3.selectAll(".lockIcons").filter(e => e.rank === stateVars.lockedRank).style("opacity", 1);
    //   d3.selectAll(".lockIcons").filter(e => e.rank !== stateVars.lockedRank).style("opacity", 0);
    // }
}


    //on click function for locking country
const labelOnClick = (d) => {
  let currRank = d.rank;

  //update the locked global rank
  if(currRank === stateVars.lockedRank){ //you click on the same country twice go back to default
    //reset locked rank to zero
    stateVars.lockedRank = 0;

    //clear initial view
    renderInitialView(countryBlurbInitial);
  } else {
    stateVars.lockedRank = currRank;

    //trigger changes to the text
    renderCountryBlurb(d.country, d.alias, d.sector) 
  }

  //show the lock
  d3.selectAll(".lockIcons").filter(e => e.rank === stateVars.lockedRank).style("opacity", 1);
  d3.selectAll(".lockIcons").filter(e => e.rank !== stateVars.lockedRank).style("opacity", 0);

  //change the opacity on bars
  d3.selectAll(".bars").filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)//classed("notLocked", lockedRank === 0 ? false : true)
  d3.selectAll(".bars").filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  //change the opacity on labels
  d3.selectAll(".countryLabels").filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)
  d3.selectAll(".countryLabels").filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  
}
/**
 * Draw the RGI scores
 * @function draw
 * @param {object} allScores - The entire set of scores for each question for each country
 * @param {object} questionFramework - The additional information required for each question, i.e. map to indicators, labels etc
 * @param {object} questionScores - The scoring metric for each question
 * @param {object} indicatorScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */

const draw = (alLScores = required(), questionFramework = required(), questionScores = required(), indicatorScores = required(), countryNames = required()) => {
  //RENDER THE INITIAL VIEW
  renderInitialView(countryBlurbInitial);

  //APPEND THE DIFFERENT SVGS  
  const labelChart = createSVG("#labels", margin = {top: 0, right: 0, bottom: 0, left: 0}),
    panelHeight = labelChart.height,
    labelSVG = labelChart.plotVar.attr("id", "labels")

  const indexChart = createSVG("#index", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    panelWidth = indexChart.width,
    indexSVG = indexChart.plotVar.attr("id", "index")

  const valueChart = createSVG("#valueRealization", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    valueSVG = valueChart.plotVar.attr("id", "valueRealization")

  const revenueChart = createSVG("#revenueManagement", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    revenueSVG = revenueChart.plotVar.attr("id", "revenueManagement")

  const enablingChart = createSVG("#enablingEnvironment", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    enablingSVG = enablingChart.plotVar.attr("id", "enablingEnvironment")

  //GENERATE THE INITIAL DATA
  indicatorScores = Array.from(indicatorScores); //convert to array

  let countryScores = computeScores(indicatorScores) //compute the different component, subcomponent scores

  let panelScores = computePanelData(countryScores, countryNames) //generate the panel data

  //update the data for default plot that is sorted on overall index ranks
  panelScores = computeRanks(panelScores, "indexScore")


  //INITIALIZE CHARTING VARIABLES

  //set the scales for the chart
    //yScale: The Y axis is ordered based on the ranks
  const yScale = d3.scaleBand()
    .rangeRound([0, panelHeight])
    .padding(0.1)
    .domain(panelScores.map(d => d.rank));

    //xScale: Each panel has the same width since each of them are bootstrap columns
  const xScale = d3.scaleLinear()
    .range([0, panelWidth])
    .domain([0, 100])

    //color scale
  const colorDomain = [0, 30, 44, 59, 74, 100]
  const colorRange = ["#A12A32", "#F78C4B", "#FEEF92", "#C1EDA2", "#75E180"]

  const colorScale = d3.scaleThreshold()
    .range(colorRange)
    .domain(colorDomain)

    //Chart dimension controls
  const labelXPos = 120,
    iconPadding = 5,
    iconSize = 15,
    barWidth = 0.5*yScale.bandwidth()

  //All tool tips
  const iconTip = d3.tip()
    .attr('class', 'd3-tip')
    .html(d => d.sector)

  const labelTip = d3.tip()
    .attr('class', 'd3-tip')


  //DRAW THE LABELS
    //mouseover function for label text
  const labelMouseOver = (d) => {
    if(d.country !== d.alias){
      labelTip.html(d.country)
      labelTip.show(d)
    }
    //show the lock if the lock is not alread on
    if(stateVars.lockedRank !== d.rank){
      d3.selectAll(".lockIcons").filter(e => e.rank === d.rank).style("opacity", 0.2)  
    }
    
  }

  const labelMouseOut = (d) => {
    if(d.country !== d.alias){
      labelTip.hide(d)
    }
    //show the lock
    if(stateVars.lockedRank !== d.rank){
      d3.selectAll(".lockIcons").filter(e => e.rank === d.rank).style("opacity", 0)  
    }
    
  }


  
  //label svg and data
  const yLabels = labelSVG.append('g')
    .selectAll(".countryLabels")
      .data(panelScores)
      .enter()

    //draw labels
  yLabels.append('g')
    .append("text")
      .attr("class", "countryLabels labelText")
      .attr("x", labelXPos)
      .attr("y", (d) => yScale(d.rank))
      .text(d => d.alias)
      .attr("text-anchor", "end")
      .style("dominant-baseline", "hanging")
      .call(labelTip)
      .on("mouseover", labelMouseOver)
      .on("mouseout", labelMouseOut)
      .on("click", labelOnClick)


    //add the mining and oil-gas icons
  yLabels.append('g')
    .append("svg:image")
      .attr("class", "sectorIcons")
      .attr("xlink:href", (d) => {return d.sector === "Mining" ? "/images/mining-cubes.svg" : "/images/oil.svg"})
      .attr("class", "countryLabels sectorIcons")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("x", labelXPos + iconPadding)
      .attr("y", (d) => yScale(d.rank) - 2)
      .call(iconTip)
      .on("mouseover", iconTip.show)
      .on("mouseout", iconTip.hide)

    //add the lock icon
  yLabels.append('g')
    .append("svg:image")
      .attr("class", "lockIcons")
      .attr("xlink:href", "/images/lock.svg")
      .attr("class", "lockIcons")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("x", 5)
      .attr("y", (d) => yScale(d.rank) - 2)
      .attr("opacity", 0)

  // console.log(panelScores)
    //draw panels
  const indexPanel = indexSVG.append("g")
      .selectAll(".bars")
      .data(panelScores)
      .enter()

  indexPanel.append("g")
    .append("rect")
      .attr("class", "bars indexBars")
      .attr("x", 0)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.indexScore))
      .attr("height", barWidth)
      .attr("fill", d => colorScale(d.indexScore))

  indexPanel.append("g")
    .append("text")
      .attr("class", "indexText")
      .attr("x", d =>  xScale(d.indexScore))
      .attr("y", d => yScale(d.rank))
      .text(d => Math.round(d.indexScore))
      .attr("text-anchor", d => xScale(d.indexScore) < 9 ? "start" : "end")
      .style("dominant-baseline", "hanging")

  const valuePanel = valueSVG.append("g")
      .selectAll(".bars")
      .data(panelScores)
      .enter()

  valuePanel.append("g")
    .append("rect")
      .attr("class", "bars valueBars")
      .attr("x", 0)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.valueRealization))
      .attr("height", barWidth)
      .attr("fill", d => colorScale(d.valueRealization))

  valuePanel.append("g")
    .append("text")
      .attr("class", "valueText")
      .attr("x", d => xScale(d.valueRealization))
      .attr("y", d => yScale(d.rank))
      .text(d => Math.round(d.valueRealization))
      .attr("text-anchor", d => xScale(d.valueRealization) < 9 ? "start" : "end")
      .style("dominant-baseline", "hanging")

  const revenuePanel = revenueSVG.append("g")
      .selectAll(".bars")
      .data(panelScores)
      .enter()

  revenuePanel.append("rect")
      .attr("class", "bars revenueBars")
      .attr("x", 0)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.revenueManagement))
      .attr("height", barWidth)
      .attr("fill", d => colorScale(d.revenueManagement))

  revenuePanel.append("g")
    .append("text")
      .attr("class", "revenueText")
      .attr("x", d => xScale(d.revenueManagement))
      .attr("y", d => yScale(d.rank))
      .text(d => Math.round(d.revenueManagement))
      .attr("text-anchor", d => xScale(d.revenueManagement) < 9 ? "start" : "end")
      .style("dominant-baseline", "hanging")

  const enablingPanel = enablingSVG.append("g")
      .selectAll(".bars")
      .data(panelScores)
      .enter()

  enablingPanel.append("rect")
      .attr("class", "bars enablingBars")
      .attr("x", 0)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.enablingEnvironment))
      .attr("height", barWidth)
      .attr("fill", d => colorScale(d.enablingEnvironment))

  enablingPanel.append("g")
    .append("text")
      .attr("class", "enablingText")
      .attr("x", d => xScale(d.enablingEnvironment))
      .attr("y", d => yScale(d.rank))
      .text(d => Math.round(d.enablingEnvironment))
      .attr("text-anchor", d => xScale(d.enablingEnvironment) < 9 ? "start" : "end")
      .style("dominant-baseline", "hanging")


  //Vanilla JS event listeners
    //Sort panel based on clicks on the label
    //callback for the label click
  const labelCallback = (event) => {
    // console.log(event)
    const idMaps ={ //maps each ranking
    "2017 RGI Index": "indexScore",
    "Value Realization": "valueRealization",
    "Revenue Management": "revenueManagement",
    "Enabling Environment": "enablingEnvironment"
    }
      //GET: current sorting column
    const labelVar = idMaps[event.target.innerText];

      //GET: current sorticon el and classes of parent svg
    const currSortIcon = event.target.parentNode.parentNode.children[0].children[0].children[0];
    const currClasses = event.target.parentNode.parentNode.children[0].children[0].classList

      //DO: The sort direction for eveny panel should mirror the current active sort direction. The sort direction can only be changed by clicking again on the current sorted panel
      //SET the sort direction. 
        //If the sort by variable is the same as the label that was clicked then change the sort direction for all panels
        //Else update the sortBy variable
      //SET the href for sort icons
        //If sortby var is the same as clicked then update href to corresponding sort direction for all panels
        //Else if the click is on a new panel then do nothing since we want to preserve the previous sort order until double click
      //SET the classlist for sort icons
        //If sortby var is the same as clicked do nothing i.e. icon is already visible
        //Else remove sorted class from previous and apply to current

    if(stateVars.sortBy === labelVar){
      //SET the state of the sort direction
      stateVars.sortDirection = stateVars.sortDirection === "ascending" ? "descending" : "ascending";

      //SET the href for the sort icons for all to match the current
      document.querySelectorAll(".sortIcon image").forEach(img => img.setAttribute('xlink:href', stateVars.sortDirection === "ascending" ? "/images/sortAsc.svg" : "/images/sortDesc.svg"))
      
    } else {
      //SET the current sorted var state
      stateVars.sortBy = labelVar;

      //SET the sorted class to clicked svg
      document.querySelector(".sorted").classList.remove("sorted") //remove the previous sorted
      currClasses.add("sorted"); //apply to current
    }

    //GET current rank and locked country sector
    const currRank = stateVars.lockedRank;
    let lockedCountry,
      lockedSector;

    if(currRank !== 0){ //i.e. there is a lock on a rank
      //GET the country and sector
      lockedCountry = panelScores.filter(d => d.rank === currRank)[0].country
      lockedSector = panelScores.filter(d => d.rank === currRank)[0].sector
    }
    //SET the panel data
    panelScores = computeRanks(panelScores, labelVar, sortDirection = stateVars.sortDirection)
    
    //SET: Update the locked rank
    stateVars.lockedRank = currRank === 0 ? 0 : panelScores.filter(d => d.country === lockedCountry && d.sector === lockedSector)[0].rank

    //redraw plots
    panelUpdate(yLabels, panelScores, xScale, yScale, colorScale)
  }
  //Bind the sort function on the label selection nodes
  const labelSel = document.querySelectorAll(".topLabel p")
  labelSel.forEach(node => node.addEventListener("click", labelCallback))
}

//fix the top x axis: http://bl.ocks.org/lmatteis/895a134f490626b0e62796e92a06b9c1


//Load all the data and draw
async function getData() {
    //load the all scores
    let alLScores = await d3.csv("/javascripts/data/alLScores.csv");
    
    //load the question framework
    let questionFramework = await d3.csv("/javascripts/data/questionFramework.csv");

    //load the scoring metric
    let questionScores = await d3.csv("/javascripts/data/questionScores.csv");

    //load the indicator scores
    let indicatorScores = await d3.csv("/javascripts/data/indicatorScores.csv");

    //get country names
    let countryNames = await d3.csv("/javascripts/data/countryNames.csv");
    
    //draw the charts using all the data
    return draw(alLScores, questionFramework, questionScores, indicatorScores, countryNames)// something using both resultA and resultB
}

getData()








