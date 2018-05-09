//INITIALIZE CHART STATE VARS
// const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: {indexScore: "ascending", valueRealization: "ascending", revenueManagement: "ascending", enablingEnvironment: "ascending"},}
const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: "ascending", indicator: "", component: ""}

const initialBlurb = `
  <div class="row ml-2">
  <h3>RGI Tool</h3>
    <p class="explainer"><a href="http://www.resourcegovernanceindex.org/" target="_blank" rel="noopener">The 2017 Resource Governance Index</a> 
    (RGI) measures the quality of resource governance in 81 countries that together produce 82 percent of the world’s oil, 78 percent of its gas and a significant proportion of minerals. It is the product of 89 country assessments (eight countries were assessed in two sectors), compiled by 150 researchers, using almost 10,000 supporting documents to answer 149 questions. Use this tool to explore these scores and manipulate them to visualize the impact of policy changes on overall ranking in the index.</p>
    <h5>Click on a country to view profile</h5>
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
 * @returns {object} - Returns the width, height and svg
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */
const createSVG = (selector = required(), margin = {top: 5, right: 5, bottom: 5, left: 5}) => { //plotVar, margin, padding
  const outerWidth = d3.select(selector).node().clientWidth,
    outerHeight = d3.select(selector).node().clientHeight,
    width = outerWidth - (margin.left + margin.right),
    height = outerHeight - (margin.top + margin.bottom),
    plotVar = d3.select(selector).append('svg')
        .attr('width', outerWidth)
        .attr('height', outerHeight)
      .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  return {width, height, plotVar}
}

/**
 * Render the initial view
 * @function renderInitialView
 * @param {string} initialBlurb - The initial text to be appended to the country blurb section
 * @description given a set of template strings render the initial views
 */

const renderInitialView = (initialBlurb) => {
  const countryBlurbEl = document.querySelector("#countryContent")
  while(countryBlurbEl.firstChild){
    countryBlurbEl.removeChild(countryBlurbEl.firstChild);
  }
  // document.querySelector(".js-line").classList.contains("inner") ? document.querySelector(".js-line").classList.remove("inner") : null;
  countryBlurbEl.innerHTML = initialBlurb;
}

const renderCountryBlurb = (country, alias, sector, countryData) => {
  const countryBlurbEl = document.querySelector("#countryContent")
  while(countryBlurbEl.firstChild){
    countryBlurbEl.removeChild(countryBlurbEl.firstChild);
  }
  const blurbText = countryData.filter(d => d.country === country && d.sector === sector)[0].blurb
  
  const countryBlurb = `
    <div class="row">
      <div class="col-md-2 js-countryIndicators m-0 p-0" id="countryIndicators">
        
      </div>
      <div class="col-md-10 m-0 p-0">
        <div class = "col-md-12 sticky-top dynamicTitle">
          <h5>${country.concat(sector).length < 34 ? country : alias} - ${sector} sector</h5>
        </div>
        <div class = "col-md-12 js-countryBlurb countryBlurb">
          <p class="explainer">${blurbText}</p>
        </div>
        <hr>
        <div class = "col-md-12">
          <h7 class="js-indiTitle"></h7>
          <p class="explainer">Click on indicator to view questions</p>
        </div>
      </div>
    </div>  
  `
  countryBlurbEl.innerHTML = countryBlurb;
  // document.querySelector(".js-line").classList.add("inner")
}

//given the params pull out the questions, selected labels and current justification
const renderQuestions = (country, sector, indicator, allScores) => {

}

/**
 * Calculate the indicator scores from the clean data + ee data
 * @function computeIndicatorData
 * @param {object} indicatorScores - The entire set of scores for each question for each country
 * @param {object} framework - The additional information required for each question, i.e. map to indicators, labels etc
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */
const computeIndicatorData = (allScores, eeScores, framework) => {
  // console.log(indicatorScores)
  const indicatorList = [...new Set(framework.map(d => d.indicator))]

  const surveyIndicatorList = [...new Set(framework.filter(d => d.component !== "Enabling environment").map(d => d.indicator))]
  const enablingIndicatorList = [...new Set(framework.filter(d => d.component === "Enabling environment").map(d => d.indicator))]

  //Loop through country sector combo and get the indicator scores using chunk below
  const countrySectorList = [...new Set(allScores.map(d => (d.country).concat("?").concat(d.sector)))];

  const data = countrySectorList.reduce((outArray, countrySector) => { 
    //get the country
    let country = countrySector.split("?")[0]

    //get the sector
    let sector = countrySector.split("?")[1]

    //get the country data for values realization and revenue management
    let countrySurveyData = allScores.filter(d => d.country === country && d.sector === sector)
    let countryEnablingData = eeScores.filter(d => d.country === country && d.sector === sector)

    //loop through survey indicators to calculate the scores for each indicator
    //mirror the structure of the indicator scores data
    surveyIndicatorList.forEach((surveyIndicator) => {
      let component = framework.filter(d => d.indicator === surveyIndicator)[0].component
      let subComponent = framework.filter(d => d.indicator === surveyIndicator)[0].subComponent
      let indicatorData = countrySurveyData.filter(d => d.indicator === surveyIndicator)
      let indiScore = indicatorData.reduce((sum, d) => {
        sum += parseFloat(d.score)
        return sum
      }, 0)
      //if the sum is zero it means that the particular survey indicator was not covered in that country + sector
      //the array should not be pushed for these cases
      if(indicatorData.length !== 0) {
        outArray.push({
          country,
          sector,
          indicator: surveyIndicator,
          component,
          subComponent,
          score: indiScore/indicatorData.length
        })
      }
    })


    //loop through enabling indicators
    enablingIndicatorList.forEach((eeIndicator) => {
      let component = framework.filter(d => d.indicator === eeIndicator)[0].component
      let subComponent = framework.filter(d => d.indicator === eeIndicator)[0].subComponent
      let indicatorData = countryEnablingData.filter(d => d.indicator === eeIndicator)

      let indiScore = indicatorData.reduce((sum, d) => {
        sum += parseFloat(d.score)
        return sum
      }, 0)
      
      //if the sum is zero it means that the particular survey indicator was not covered in that country + sector
      //the array should not be pushed for these cases
      if(indicatorData.length !== 0) {
        outArray.push({
          country,
          sector,
          indicator: eeIndicator,
          component,
          subComponent,
          score: indiScore/indicatorData.length
        })
      }
    })

    return outArray
    
  }, [])

  return data;
}

/**
 * Extract data for the panel (indexScore and component scores)
 * @function panelData
 * @param {object} countryScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given the countryScores extract the index and component scores along with rank for plotting
 */
const computePanelData = (indicatorScores, countryData, framework) => {
  // console.log(countryData)
  const countrySectorList = [...new Set(indicatorScores.map(d => (d.country).concat("?").concat(d.sector)))]
  // const subComponentList = [...new Set(framework.map(d => d.subComponent))]
  const componentList = [...new Set(framework.map(d => d.component))]

  // console.log(countrySectorList)
  //loop through each country list combo
  const panelData = countrySectorList.reduce((outArray, countrySector) => {
    //get the country
    let country = countrySector.split("?")[0]

    //get the sector
    let sector = countrySector.split("?")[1]

    //get the alias
    let alias = countryData.filter(d => d.country === country && d.sector === sector)[0].alias

    //get the country sector data to calculate the panel scores
    let countrySectorData = indicatorScores.filter(d => d.country === country && d.sector === sector)
    
    //loop through the component list
    let countryComponentData = componentList.reduce((componentData, component) => {
      //find the list of correponding subcomponents
      let subComponentList = [...new Set(framework.filter(d => d.component === component).map(d => d.subComponent))]
      
      //store the subComponent Scores
      let subComponentScores = []

      subComponentList.forEach((subComponent) => {
        //filter the relevant sub component data
        let subComponentData = countrySectorData.filter(d => d.subComponent === subComponent)


        //compute the total
        let scoreTotal = subComponentData.reduce((sum, value) => {
          sum += parseFloat(value.score)
          return sum
        }, 0)


        //only push if a subcomponent is covered
        if(subComponentData.length > 0){

          subComponentScores.push(scoreTotal/subComponentData.length)
        }
      })

      //reduce the subComponent scores
      let componentTotal = subComponentScores.reduce((sum, value) => {
        sum += parseFloat(value)
        return sum
      }, 0)

      //only push if component is covered
      if(subComponentScores.length > 0){
        componentData.push({
          component,
          score: componentTotal/subComponentScores.length
        })
      }
      return componentData
    }, [])
    //convert the component data to the format required for the panel dataset
    let valueRealization = countryComponentData.filter(d => d.component === "Value realization")[0].score
    let revenueManagement = countryComponentData.filter(d => d.component === "Revenue management")[0].score
    let enablingEnvironment = countryComponentData.filter(d => d.component === "Enabling environment")[0].score
    let indexScore = countryComponentData.reduce((sum, val) => {
        sum += val.score
        return sum
      }, 0)/3

    outArray.push({
      country,
      sector,
      alias,
      valueRealization,
      revenueManagement,
      enablingEnvironment,
      indexScore,

    })
    return outArray
  }, [])

  return panelData
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


//draw the country indicator chart
const drawCountryChart = (selector, countryData, framework, colorScale) => {
  
  //Fill in the framework data
  // console.log(countryData, framework)

  //Create a dataset at the level of the indicator. Mark those that are absent as not covered to fill with grey
  const indicatorList = [...new Set(framework.filter(d => d.component !== "Enabling environment").map(d => d.indicator))]

  const chartData = indicatorList.reduce((data, indicator) => {
    const indiData = countryData.filter(d => d.indicator === indicator)
    const score = indiData.length === 0 ? "Not Covered" : indiData[0].score

    data.push({indicator, score, component: framework.filter(d => d.indicator === indicator)[0].component})
    return data
  }, [])

  //create the chart data with not covered as an option
  const indicatorChart = createSVG(selector, margin = {top: 0, right: 0, bottom: 0, left: 0}),
    indicatorWidth = indicatorChart.width,
    indicatorHeight = indicatorChart.height,
    indicatorSVG = indicatorChart.plotVar
  // const {indicatorWidth, indicatorHeight, indicatorSVG} = createSVG(selector, margin = {top: 0, right: 0, bottom: 0, left: 0})

  const indicatorYScale = d3.scaleBand()
      .rangeRound([0, indicatorHeight])
      .padding(0.1)
      .domain([...new Set(chartData.map(d => d.indicator))]);


  //on component label mouseover draw left border on the indicator chart
  const mouseOverComponent = (d) => {
    // const componentData = countryData.filter()
    // const indiBars = d3.selectAll(".indiBars").filter(e => e.component === d)
    const indiText = d3.selectAll(".indiText").filter(e => e.component === d)

    indiText.classed("activeText", true)
  }
  //on component label mouseout remove left border on the indicator chart
  const mouseOutComponent = (d) => {
    // const componentData = countryData.filter()
    // const indiBars = d3.selectAll(".indiBars").filter(e => e.component === d)
    const indiText = d3.selectAll(".indiText").filter(e => e.component === d)

    indiText.classed("activeText", false)

  }
  //on indicator mouseover show tool tip with name of the indicator and subcomponent 
  //and change class on component label to show active
  const mouseOverIndicator = (d) => {
    const component = d3.selectAll(".componentLabels").filter(e => e === d.component)
    const indiText = d3.selectAll(".indiText").filter(e => e.indicator === d.indicator)
    const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator === d.indicator)
    const indiTitle = document.querySelector(".js-indiTitle")
    const clicked = stateVars.indicator


    component.classed("activeText", true)
    indiText.classed("activeText", true)
    indiRect.classed("selectedRect", true)
    indiTitle.innerHTML = d.indicator
  }

  //on indicator mouseout remove tool tip and active class on component label
  const mouseOutIndicator = (d) => {
    
    const clicked = stateVars.indicator

    const component = d3.selectAll(".componentLabels").filter(e => e === d.component)
    const indiText = d3.selectAll(".indiText").filter(e => e.indicator === d.indicator)
    const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator === d.indicator)
    const indiTitle = document.querySelector(".js-indiTitle")
    indiTitle.innerHTML = ""
    component.classed("activeText", false)
    indiText.classed("activeText", false)
    indiRect.classed("selectedRect", false)  
      

      // if(clicked === ""){
      //   const component = d3.selectAll(".componentLabels").filter(e => e === d.component)
      //   const indiText = d3.selectAll(".indiText").filter(e => e.indicator === d.indicator)
      //   const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator === d.indicator)
      //   const indiTitle = document.querySelector(".js-indiTitle")
      //   indiTitle.innerHTML = ""
      //   component.classed("activeText", false)
      //   indiText.classed("activeText", false)
      //   indiRect.classed("selectedRect", false)   
      // } else {
      //   const component = d3.selectAll(".componentLabels").filter(e => e === d.component)
      //   const indiText = d3.selectAll(".indiText").filter(e => e.indicator === clicked)
      //   const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator === clicked)
      //   const indiTitle = document.querySelector(".js-indiTitle")
      //   indiTitle.innerHTML = clicked
      // }
      
    
    
  }

  //onClick Indicator
  const indiOnClick = (d) => {
    console.log(d.indicator, stateVars.indicator)
    //update the state
    if(stateVars.indicator === d.indicator){ //reset the state var
      stateVars.indicator = ""
    } else {
      stateVars.indicator = d.indicator;
    }
  }

  const countryChart = indicatorSVG.append("g")
      .selectAll(".countryIndicators")
      .data(chartData)
      .enter()

  countryChart.append("g")
    .append("rect")
      .attr("class", "indiBars")
      .attr("x", 3 * indicatorWidth/5)
      .attr("y", d => indicatorYScale(d.indicator))
      .attr("width", indicatorWidth/5)
      .attr("height", indicatorYScale.bandwidth())
      .attr("fill", d => d.score === "Not Covered" ? "grey" :colorScale(d.score))
      .on("mouseover", mouseOverIndicator)
      .on("mouseout", mouseOutIndicator)
      .on("click", indiOnClick)

  countryChart.append("g")
    .append("text")
    .attr("class", "indiText valueText")
    .attr("x", 2.5 * indicatorWidth/5)
    .attr("y", d => indicatorYScale(d.indicator))
    .text(d => d.score === "Not Covered" ? "" : Math.round(d.score))
    .style("text-anchor", "end")
    .style("dominant-baseline", "hanging")

  const componentLabels = indicatorSVG.append("g")
      .selectAll(".componentLabels")
      .data(["Value realization", "Revenue management"])
      .enter()


  componentLabels.append("g")
    .append("text")
      .text((d) => d)
      .attr("class", "componentLabels")
      .attr("y", indicatorWidth/5)
      .attr("x", (d, i) => i === 0 ? -1.4*indicatorHeight/4 : -0.82*indicatorHeight)
      .attr("transform", "rotate(270)")
      .style("text-anchor", "middle")
      .on("mouseover", mouseOverComponent)
      .on("mouseout", mouseOutComponent)

  //draw strokes to separate the value realization and revenue management indicators
  const firstValue = countryData.filter((d) => d.component === "Value realization")[0].indicator;
  const firstRev = countryData.filter((d) => d.component === "Revenue management")[0].indicator;
  const lastRevPos = indicatorYScale(indicatorYScale.domain()[indicatorYScale.domain().length - 1]) + indicatorYScale.bandwidth()
  
  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 1*indicatorWidth/5)
      .attr("x2", 4*indicatorWidth/5)
      .attr("y1", indicatorYScale(firstValue))
      .attr("y2", indicatorYScale(firstValue))

  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 1*indicatorWidth/5)
      .attr("x2", 4*indicatorWidth/5)
      .attr("y1", indicatorYScale(firstRev) + 1)
      .attr("y2", indicatorYScale(firstRev) + 1)

  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 1*indicatorWidth/5)
      .attr("x2", 4*indicatorWidth/5)
      .attr("y1", lastRevPos)
      .attr("y2", lastRevPos)
    
}

//update indicator data

/**
 * Update the panel using the indicator data
 * @function panelUpdate
 * @param {object} xScale - The x-axis scale for the chart
 * @param {object} yScale - The y-axis scale for the chart
 * @param {object} colorScale - The colorScale for the bars
 * @description given the new panel data, update the charts and the labels
 */
const panelUpdate = (yLabels, panelData, xScale, yScale, colorScale) => {
    // console.log(panelData)
    //update the data
    d3.selectAll(".countryLabels").data(panelData, d => d.rank)
    //SET: Update all the label elements
    const labelText = d3.selectAll(".labelText")
    const sectorIcons = d3.selectAll(".sectorIcons")
    const lockIcons = d3.selectAll(".lockIcons")
    const rankCircles = d3.selectAll(".rankCircles")
    const rankText = d3.selectAll(".ranks")

    // rankCircles.data(panelData, d => d.rank)
    // labelText.data(panelData, d => d.rank)
    // sectorIcons.data(panelData, d => d.rank)
    
    //this works but the general setup doesn't
    

    // rankCircles.filter(d => d.rank === 10).style("fill", colorScale(d => d[stateVars.sortBy]))

    const nRanks = document.querySelectorAll(".labelText").length
    
    labelText.transition().duration(500).attr("y", d => yScale(d.rank))
    sectorIcons.transition().duration(500).attr("y", d => yScale(d.rank))
    lockIcons.transition().duration(500).attr("y", d => yScale(d.rank))    
    rankText.transition().duration(500).text((d, i) => stateVars.sortDirection === "ascending" ? i + 1 : nRanks - i)//if sort direction is reverse then reverse the ranks
    // rankText.attr("fill", d => colorScale(d[stateVars.sortBy]))
    // rankCircles.transition().duration(500).attr("fill", (d) => colorScale(d[stateVars.sortBy]))
    // rankCircles.attr("dy", d => yScale(d.rank) ) //+ 0.7 * barWidth

    // labelText.each(function(d) {console.log(this,d.country, colorScale(d[stateVars.sortBy]))})



    // attr("fill", (d, i) => {
    //   // console.log(d.rank, d.country, colorScale(d[stateVars.sortBy]))
    //   return newColors[i]
    // })

    //SET: Update all the bars
    const indexBars = d3.selectAll(".indexBars")
    const indexText = d3.selectAll(".indexText")
    const valueBars = d3.selectAll(".valueBars")
    const valueText = d3.selectAll(".valueText")
    const revenueBars = d3.selectAll(".revenueBars")
    const revenueText = d3.selectAll(".revenueText")
    const enablingBars = d3.selectAll(".enablingBars")
    const enablingText = d3.selectAll(".enablingText")
    
    indexBars.transition().duration(500).attr("y", d => yScale(d.rank))
        
    indexText.transition().duration(500).attr("y", d => yScale(d.rank))
    valueBars.transition().duration(500).attr("y", d => yScale(d.rank))
    valueText.transition().duration(500).attr("y", d => yScale(d.rank))
    revenueBars.transition().duration(500).attr("y", d => yScale(d.rank))
    revenueText.transition().duration(500).attr("y", d => yScale(d.rank))
    enablingBars.transition().duration(500).attr("y", d => yScale(d.rank))
    enablingText.transition().duration(500).attr("y", d => yScale(d.rank))
    

    //implemet a scroll if locked is on: http://bl.ocks.org/humbletim/5507619
    // const scrollTopTween(scrollTop){

    // }
    // function scrollTopTween(scrollTop) {
    //   return function() {
    //     var i = d3.interpolateNumber(this.scrollTop, scrollTop);
    //     return function(t) { this.scrollTop = i(t); };
    // }

    // if(stateVars.lockedRank !== 0) {
    //   d3.select("#chart").transition().duration(3000)
    //     .tween("scroll", scrollTween(document.body.getBoundingClientRect().height - window.innerHeight))
    //     .tween("uniquetweenname", scrollTopTween(yScale(stateVars.lockedRank)))
    // }
}


/**
 * Update the html content, lock a bar and show country level plot based on click
 * @function labelOnClick
 * @param {datum} d - the datum associated with the clicked node
 * @param {object} countryData - The data specific to that country i.e. its blurb and any additional values to pass in later
 * @param {object} indicatorScores - The scores for each indicator/country
 * @description when a label is clicked lock it and update the charts
 */
const labelOnClick = (d, countryData, indicatorScores, framework, colorScale) => {
  let currRank = d.rank;

  //update the locked global rank
  if(currRank === stateVars.lockedRank){ //you click on the same country twice go back to default
    //reset locked rank to zero
    stateVars.lockedRank = 0;

    //clear initial view
    renderInitialView(initialBlurb);
  } else {
    stateVars.lockedRank = currRank;

    //trigger changes to the text
    renderCountryBlurb(d.country, d.alias, d.sector, countryData)

    //render indicator chart
    let countrySectorData = indicatorScores.filter(e => e.country === d.country && e.sector === d.sector && e.component !== "Enabling environment")
    drawCountryChart("#countryIndicators", countrySectorData, framework, colorScale)
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
 * @param {object} framework - The additional information required for each question, i.e. map to indicators, labels etc
 * @param {object} scoringMetric - The scoring metric for each question
 * @param {object} indicatorScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */


const draw = (allScores = required(), framework = required(), questionScores = required(), countryData = required(), eeScores = required()) => {
  //RENDER THE INITIAL VIEW
  renderInitialView(initialBlurb);

  //APPEND THE DIFFERENT SVGS  
  const labelChart = createSVG("#labels", margin = {top: 0, right: 0, bottom: 0, left: 0}),
    panelHeight = labelChart.height,
    labelSVG = labelChart.plotVar;

  const indexChart = createSVG("#index", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    panelWidth = indexChart.width,
    indexSVG = indexChart.plotVar;

  const valueChart = createSVG("#valueRealization", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    valueSVG = valueChart.plotVar;

  const revenueChart = createSVG("#revenueManagement", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    revenueSVG = revenueChart.plotVar;

  const enablingChart = createSVG("#enablingEnvironment", margin = {top: 0, right: 0, bottom: 0, left: 1}),
    enablingSVG = enablingChart.plotVar;

  //cannot draw this until the element is created through renderCountryBlurb
  

  //GENERATE THE INITIAL DATA
  let indicatorScores = computeIndicatorData(allScores, eeScores, framework)

  let panelScores = computePanelData(indicatorScores, countryData, framework)
  
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
  const colorDomain = [30, 44, 59, 74, 100]
  const colorRange = ["#A12A32", "#F78C4B", "#FEEF92", "#C1EDA2", "#75E180"]

  const colorScale = d3.scaleThreshold()
    .range(colorRange)
    .domain(colorDomain)

    //Chart dimension controls
  const labelSpace = document.querySelector(".js-labels").clientWidth,
    iconPadding = 2,
    iconSize = 12,
    labelXPos = labelSpace - iconPadding * 2 - iconSize,
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
  const yLabels = labelSVG.append("g")
    .selectAll(".countryLabels")
      .data(panelScores)
      .enter()

    //draw labels
  yLabels.append("text")
      .attr("class", "countryLabels labelText")
      .attr("x", labelXPos)
      .attr("y", (d) => yScale(d.rank))
      .text(d => labelXPos/12 < d.country.length ? d.alias : d.country)
      .attr("text-anchor", "end")
      .style("dominant-baseline", "hanging")
      .call(labelTip)
      .on("mouseover", labelMouseOver)
      .on("mouseout", labelMouseOut)
      .on("click", d => labelOnClick(d, countryData, indicatorScores, framework, colorScale))

  yLabels.append("text")
      .attr("class", "ranks")
      .attr("x", iconSize + 10 * iconPadding)
      .attr("y", d => yScale(d.rank) + 0.12 * barWidth)
      .text((d, i) => i + 1)
      .style("dominant-baseline", "hanging")
      .attr("text-anchor", "middle")


    //add the mining and oil-gas icons
  yLabels.append("svg:image")
      .attr("class", "sectorIcons")
      .attr("xlink:href", (d) => {return d.sector === "Mining" ? "/images/miningicon.svg" : "/images/oilGasicon.svg"})
      .attr("class", "countryLabels sectorIcons")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("x", labelXPos + iconPadding)
      .attr("y", (d) => yScale(d.rank))
      .call(iconTip)
      .on("mouseover", iconTip.show)
      .on("mouseout", iconTip.hide)

    //add the lock icon
  yLabels.append("svg:image")
      .attr("class", "lockIcons")
      .attr("xlink:href", "/images/unlock.svg")
      .attr("class", "lockIcons")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("x", iconPadding)
      .attr("y", (d) => yScale(d.rank))
      .attr("opacity", 0)

    //add ranks inside circles
  // yLabels.append("circle")
  //     .attr("class", "countryLabels rankCircles")
  //     .attr("cx", iconSize + 4 * iconPadding)
  //     .attr("cy",d => yScale(d.rank) + 0.7 * barWidth)
  //     .attr("r", "6.5px")
  //     .style("fill", d => colorScale(d[stateVars.sortBy]))



  
    //draw all the panels
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
      .style("fill", d => d.indexScore < 30 && xScale(d.indexScore) >= 9 ? "lightgrey" : "black")
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
      .style("fill", d => d.valueRealization < 30 && xScale(d.valueRealization) >= 9 ? "lightgrey" : "black")
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
      .style("fill", d => d.revenueManagement < 30 && xScale(d.revenueManagement) >= 9 ? "lightgrey" : "black")
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
      .style("fill", d => d.enablingEnvironment < 30 && xScale(d.enablingEnvironment) >= 9 ? "lightgrey" : "black")
      .style("dominant-baseline", "hanging")


  //Label click event listener
    //Sort panel based on clicks on the label, update state variables
    //callback for the label click
  const labelCallback = (event) => {
    // console.log(event)
    const idMaps ={ //maps each ranking to the variable name used for scoring
    "2017 RGI composite": "indexScore",
    "Value realization": "valueRealization",
    "Revenue management": "revenueManagement",
    "Enabling environment": "enablingEnvironment"
    }
      //GET: current sorting column
    const labelVar = idMaps[event.target.innerText];

      //GET: classes of parent svg
    const currClasses = event.target.parentNode.parentNode.children[0].children[0].classList

      //DO: The sort direction for eveny panel should mirror the current active sort direction. 
          //The sort direction can only be changed by clicking again on the current sorted panel
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
    //Update the panel data
    panelScores = computeRanks(panelScores, labelVar, sortDirection = stateVars.sortDirection)
    
    //SET: Update the locked rank
    stateVars.lockedRank = currRank === 0 ? 0 : panelScores.filter(d => d.country === lockedCountry && d.sector === lockedSector)[0].rank

    //redraw plots
    panelUpdate(yLabels, panelScores, xScale, yScale, colorScale)
  }
  
  //Bind the sort function on the label selection nodese
  const labelSel = document.querySelectorAll(".topLabel p")
  labelSel.forEach(node => node.addEventListener("click", labelCallback))
}

//fix the top x axis: http://bl.ocks.org/lmatteis/895a134f490626b0e62796e92a06b9c1


//Load all the data and draw
async function getData() {
    //load the all scores
    let questionScores = await d3.csv("/javascripts/data/questionScores.csv");
    
    //load the question framework
    let framework = await d3.csv("/javascripts/data/framework.csv");

    //load the scoring metric
    let scoringMetric = await d3.csv("/javascripts/data/scoringMetric.csv");

    //load the indicator scores
    // let indicatorScores = await d3.csv("/javascripts/data/indicatorScores.csv");

    //get country names
    let countryData = await d3.csv("/javascripts/data/countryData.csv");

    //get ee scores
    let eeScores = await d3.csv("/javascripts/data/eeScores.csv");
    
    //draw the charts using all the data
    return draw(questionScores, framework, scoringMetric, countryData, eeScores)// something using both resultA and resultB
}

getData()








