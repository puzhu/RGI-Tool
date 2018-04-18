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

  const xScale = d3.scaleOrdinal()
      .range([0, width]);
  const yScale = d3.scaleOrdinal()
      .range([height, 0]);

  return {width, height, plotVar, xScale, yScale}
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

  return countryScores
}

/**
 * Compute the ranks of different countries for the index, component and subcomponents
 * @function computeScores
 * @param {object} countryScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @param {object} level - This can be either be index, component or subComponent
 * @description given the indicatorScores for each country compute the overall rank position for each country
 */

const computeRanks = (countryScores = required(), countryNames = required()) => {
  //sort based on index score and then use the indices to generate the rank
  let ranked = countryScores.sort((a, b) => b.indexScore - a.indexScore)
    .reduce((accum, val, i) => {
      accum.push({country: val.country, alias: countryNames.filter((d) => d.country === val.country)[0].alias, sector: val.sector, score: val.indexScore, rank: i + 1,})

      return accum;
    }, [])
  return ranked;
}

/**
 * Compute vertical positions
 * @function yposition
 * @param {object} countryRanks - Each country ranked and scored
 * @param {object} svgChars - The characteristics of the SVG
 * @description given the a set of ranks give the relative y position on the chart
 * @returns {object}
 */


/**
 * Draw the chart
 * @function drawChart
 * @param {object} countryRanks - Each country ranked and scored
 * @param {object} svgChars - The characteristics of the SVG
 * @description given the a set of ranks give the relative y position on the chart
 * @returns {object}
 */

 /**
 * Update the chart
 * @function updateChart
 * @param {object} countryRanks - Each country ranked and scored
 * @param {object} countryRanks - Each country ranked and scored
 * @param {object} svgChars - The characteristics of the SVG
 * @description given the a set of ranks give the relative y position on the chart
 * @returns {object}
 */

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
  //draw the svg
  const chart = createSVG('#chart', margin = {top: 5, right: 0, bottom: 5, left: 0}),
    chartWidth = chart.width,
    chartHeight = chart.height,
    chartSVG = chart.plotVar.attr("id", "chartSVG"),
    xChartScale = chart.xScale,
    yChartScale = chart.yScale;


  indicatorScores = Array.from(indicatorScores);

  const countryScores = computeScores(indicatorScores)
  
  const countryRanks = computeRanks(countryScores, countryNames)


  //Chart dimension controls
  const labelXPos = 90,
    iconPadding = 10,
    labelYPos = 60,
    labelYHeight = 25,
    iconSize = 15;

  //All tool tips
  const iconTip = d3.tip()
    .attr('class', 'd3-tip')
    .html(d => d.sector)

  const labelTip = d3.tip()
    .attr('class', 'd3-tip')
    
  //draw the icons
  chartSVG.append('g')
    .selectAll(".sectorIcons")
    .data(countryRanks)
    .enter()
    .append("svg:image")
    .attr("class", "sectorIcons")
    .attr("xlink:href", (d) => {return d.sector === "Mining" ? "/images/mining-cubes.svg" : "/images/oil.svg"})
    .attr("width", iconSize)
    .attr("height", iconSize)
    .attr("x", labelXPos + iconPadding)
    .attr("y", (d, i) => labelYPos + (i + 1) * labelYHeight - iconSize + 2)
    .call(iconTip)
    .on("mouseover", iconTip.show)
    .on("mouseout", iconTip.hide)
  
  //draw the labels
    //mouseover function for labels
  const labelMouseOver = (d) => {
    if(d.country !== d.alias){
      labelTip.html(d.country)
      labelTip.show(d)
    }
  }

  chartSVG.append('g')
    .selectAll(".countryLabels")
    .data(countryRanks)
    .enter()
    .append("text")
    .attr("class", "countryLabels")
    .attr("x", labelXPos)
    .attr("y", (d, i) => labelYPos + (i + 1) * labelYHeight)
    .text(d => d.alias)
    .attr("text-anchor", "end")
    .call(labelTip)
    .on("mouseover", labelMouseOver)
    .on("mouseout", labelTip.hide)

  


  
  
}




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








