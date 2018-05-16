//INITIALIZE CHART STATE VARS
// const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: {indexScore: "ascending", valueRealization: "ascending", revenueManagement: "ascending", enablingEnvironment: "ascending"},}
const stateVars = {lockedRank: 0, sortBy: "indexScore", sortDirection: "ascending", indicator: "", subComponent: "", countryEdit: "off"}

const textwrap = (text, width) => {
  text.each(function() {
    let text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr("x")
    const textWidth = this.getBoundingClientRect().width
    let dy = textWidth < width ? 0 : -(0.25 * 1.1 * Math.ceil(textWidth/width)) //replace with text.attr("dy") if there is no need for centering vertically
    // console.log(dy, textWidth, width, Math.ceil(textWidth/width))

    let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
      }
    }
  });

}

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

const renderCountryBlurb = (country, alias, sector, allData) => {
  const countryBlurbEl = document.querySelector("#countryContent")
  while(countryBlurbEl.firstChild){
    countryBlurbEl.removeChild(countryBlurbEl.firstChild);
  }
  //const blurbText = allData.countryData.filter(d => d.country === country && d.sector === sector)[0].blurb
  const idMaps ={ //maps each ranking to the variable name used for scoring
    "indexScore": "2017 Overall Index",
    "valueRealization": "Value realization",
    "revenueManagement": "Revenue management",
    "enablingEnvironment": "Enabling environment"
    }
  // const currRank = allData.panelScores.filter(d => d.country === country && d.sector === sector)[0].rank
  const countryBlurb = `
    <div class="row">
      <div class="col-md-4 js-countryIndicators m-0 p-0" id="countryIndicators">
        
      </div>
      <div class="col-md-8 m-0 p-0">
        <div class = "col-md-12 dynamicTitle">
          <h5>${country.concat(sector).length < 24 ? country : alias} - ${sector} sector</h5>
        </div>
        <div class="col-md-12 mt-0">
          <p class="secondaryText">
            <span class="item-heading-small">Ranked by: </span><span class="js-rankBy rankBy">${idMaps[stateVars.sortBy]}</span>   
            <span class="item-heading-small">Actual rank: </span><span class="badge badge-pill badge-info js-currRank">${stateVars.lockedRank}</span>
            <span class="item-heading-small">User rank: </span><span class="badge badge-pill badge-warning js-UserRank"></span>
          </p>
        </div>
        <div class = "col-md-12">
          <h7 class="js-indiTitle"></h7>
          <div class="js-questions">
            <p class="explainer">Click on indicator to view questions</p>
          </div>
          
        </div>
      </div>
    </div>  
  `
  countryBlurbEl.innerHTML = countryBlurb;
  // document.querySelector(".js-line").classList.add("inner")
}

//given the params pull out the questions, selected labels and current justification
const renderQuestions = (country, sector, indicator, chartData, allData, allScales, allChartVars) => {
  //Empty the questions div
  const questionsEl = document.querySelector(".js-questions")
  //remove all the current contents
  while(questionsEl.firstChild){
    questionsEl.removeChild(questionsEl.firstChild);
  }

  //isolate the question data
  const data = chartData.filter(d => d.indicator === indicator)[0].questions
  
  //render questions
  let questions = data.reduce((html, d) => {
    //get the list of choices
    let choiceList = d.metric.reduce((choices, id) => {
      let selected = ""
      if(d.newLabel === id.label) {
        selected = "checked"
      } else if(d.newLabel === "" && d.label === id.label) {
        selected = "checked"
      }
      // const selected = d.newLabel === id.label ? "checked" : d.label === id.label ? "checked" :  "" //if new label has been selected then apply new label else the actual label
      choices += `
      <div class="form-check">
        <input class="form-check-input js-radio" value="${d.questionID+ "?" +id.label}" type="radio" name="radio${d.questionID}" ${selected}>
        <label class="form-check-label"><span class="item-heading">${id.label}: </span>${id.explaination}</label>
      </div>
      `
      return choices
    }, ``)



    html += `
    <div class="panel panel-default">
      <div class="panel-heading">
        <p class="panel-title mb-0" id="question${d.questionID}" data-toggle="collapse" data-parent="#accordion" href="#collapse${d.questionID}">
          <span class="item-heading">${d.questionLabel}: </span>${d.question}     
        </p>
        <p class="secondaryText m-0 p-0 mt-1 mb-1">
        <span class="item-heading-small">RGI score: </span><span class="badge badge-pill badge-info">${d.score === "Not Covered" ? "Not Applicable":d.label}</span>   
        <span class="item-heading-small">User score: </span><span class="badge badge-pill badge-warning" id="badge${d.questionID}">${d.newLabel !== "" && isNaN(parseFloat(d.newScore)) ? "Not Applicable" : d.newLabel}</span>
        </p>
        
      </div>
      <div id="collapse${d.questionID}" class="panel-collapse collapse in">
        <div class="panel-body">${choiceList}</div>
        <p class="justification mt-4"><span class="item-heading">Justification for current score: </span>${d.justification}</p>
      </div>
    </div>
    `

    return html
  }, `<div class="panel-group" id="accordion"> <hr>`)

  questions += `</div>` //close the div tag on questions

  //set the questions as inner html
  questionsEl.innerHTML = questions

  //add event listeners to the radio button clicks to update everything
  document.querySelectorAll(".js-radio").forEach((btn) => {
    btn.addEventListener("click", event => {
      //get the question and label values from the value attribute of the input
      const questionID = event.target.value.split("?")[0]
      const userLabel = event.target.value.split("?")[1]
      const userScore = data.filter(d => d.questionID === questionID)[0].metric.filter(d => d.label === userLabel)[0].score

      //get the true values from the data
      const actualLabel = data.filter(d => d.questionID === questionID)[0].label
      const actualScore = data.filter(d => d.questionID === questionID)[0].score
      const activeSubComponent = chartData.filter(d => d.indicator === indicator)[0].subComponent
      const activeComponent = chartData.filter(d => d.indicator === indicator)[0].component
      
      //update the new label and score props for each question in the indicator
      chartData.filter(d => d.indicator === indicator)[0].questions.filter(d=> d.questionID === questionID)[0].newLabel = userLabel === actualLabel ? "" : userLabel
      chartData.filter(d => d.indicator === indicator)[0].questions.filter(d=> d.questionID === questionID)[0].newScore = userLabel === actualLabel ? 0 : userScore

      //set the userInput as true for indicator
      const userInput = chartData.filter(d => d.indicator === indicator)[0].questions.filter(d => d.newLabel !== "").length > 0
      
      //update the userInput property
      chartData.filter(d => d.indicator === indicator)[0].userInput = userInput

      //set the badge for user input
      const userBadgeLabel = document.querySelector(`#badge${questionID}`) //the badge
      userBadgeLabel.innerHTML = actualLabel !== userLabel ? isNaN(parseFloat(userScore)) ? "Not Applicable": userLabel : ""
      
      //we need to update the rest only if user input is true i.e. if the clicked indicator has a user input
      if(userInput) {
        console.log("Before-------", allData.panelScores.filter(d => d.country === country && d.sector === sector))
        //calculate the new indicator score based on user input
        const indiData = data.filter(d => (d.newLabel === "" && !isNaN(parseFloat(d.score))) || (d.newLabel !== "" && !isNaN(parseFloat(d.newScore)))) //keep if either new or old score score is a number 
        let newIndiScore = indiData.reduce((sum, question) => {
          //if a new label has been selected then use the new label score else use the old score
          const score = question.newLabel !== "" ? question.newScore : question.score
          if(!isNaN(parseFloat(score))){
            sum += parseFloat(score)
          }
          return sum;
        }, 0)
        newIndiScore = parseFloat(newIndiScore) === 0 ? "NA" : newIndiScore/indiData.length
        
        //update the chart score
        chartData.filter(d => d.indicator === indicator)[0].userScore = newIndiScore

        //update the indicator if there is an applicable score
        const indicatorText = d3.selectAll(".changeText").filter(e => e.indicator === indicator)
        const indiBars = d3.selectAll(".indiBars").filter(d => d.indicator === indicator)
        
        indicatorText.transition().duration(500).text( newIndiScore === "NA" ? "NA" : Math.round(newIndiScore)).attr("opacity", 1)
        indiBars.attr("fill", newIndiScore === "NA" ? "grey" : allScales.colorScale(newIndiScore))
        

        //calculate the subComponent scores
        const subComponentData = chartData.filter(d => d.subComponent === activeSubComponent).filter(d => (!d.userInput && !isNaN(parseFloat(d.score)) || (d.userInput && !isNaN(parseFloat(newIndiScore))))) //select numbers from either user input scores or rgi scores
        let newSubComponentScore = subComponentData.reduce((sum, indi) => {
          //if user has updated score then use user score else use actual
          const score = indi.userInput ? indi.userScore : indi.score
          if(!isNaN(parseFloat(score))){
            sum += parseFloat(score)
          }
          return sum
        }, 0)
        newSubComponentScore = newSubComponentScore === 0 ? "NA" : newSubComponentScore/subComponentData.length
        
        //the svg text next to the indicator that shows updated score
        const subComponentText = d3.selectAll(".userSubScore").filter(d => d.subComponent === activeSubComponent)
        subComponentText.transition().duration(250).text(Math.round(newSubComponentScore)).attr("opacity", 1)

        //update the component scores in the panel data set
        const componentData = chartData.filter(d => d.component === activeComponent)
        const allSubScores = [... new Set(componentData.map(d => d.subComponent))].reduce((scores, sub) => {
          const subData = chartData.filter(d => d.subComponent === sub).filter(d => (!d.userInput && !isNaN(parseFloat(d.score)) || (d.userInput && !isNaN(parseFloat(newIndiScore))))) //select numbers from either user input scores or rgi scores
          let currSubScore = subData.reduce((sum, indi) => {
            //if user has updated score then use user score else use actual
            const score = indi.userInput ? indi.userScore : indi.score
            if(!isNaN(parseFloat(score))){
              sum += parseFloat(score)
            }
            return sum
          }, 0)
          currSubScore = subData.length === 0 ? "NA" : currSubScore/subData.length
          
          if(subData.length !== 0) {
            scores.push(currSubScore)
          }
          return scores
        }, [])
        
        const newComponentScore = allSubScores.reduce((sum, score) => {
          sum += score
          return sum
        }, 0)/allSubScores.length

        //update the panel data scores for the corresponding component
        if(activeComponent === "Value realization"){
          allData.panelScores.filter(d => d.country === country && d.sector === sector)[0].valueRealization = newComponentScore
          
        } else {
          allData.panelScores.filter(d => d.country === country && d.sector === sector)[0].revenueManagement = newComponentScore
        }
        //the final step is to calculate the updated index score
        const currData = allData.panelScores.filter(d => d.country === country && d.sector === sector)[0]
        const indexScore = (currData.valueRealization + currData.revenueManagement + currData.enablingEnvironment)/3
        allData.panelScores.filter(d => d.country === country && d.sector === sector)[0].indexScore = indexScore

        allData.panelScores = computeRanks(allData.panelScores, stateVars.sortBy)

        

        // console.log(allData.panelScores.filter(d => d.country === country && d.sector === sector))
        console.log("After-------", allData.panelScores.filter(d => d.country === country && d.sector === sector))
      } else {
        //reset the indicator user score
        chartData.filter(d => d.indicator === indicator)[0].userScore = 0

        //reset svg
        const indicatorText = d3.selectAll(".changeText").filter(e => e.indicator === indicator)
        const subComponentText = d3.selectAll(".userSubScore").filter(d => d.subComponent === activeSubComponent)
        const indiBars = d3.selectAll(".indiBars").filter(d => d.indicator === indicator)

        indicatorText.text(Math.round(actualScore)).attr("opacity", 0)
        subComponentText.text(d => d.score ==="Not Covered" ? "" : Math.round(d.score)).attr("opacity", 0)
        indiBars.attr("fill", d => d.score === "Not Covered" ? "grey" : allScales.colorScale(d.score))
      }

      //redraw panel
      panelUpdate(allScales, allChartVars)

      //update the rank
      document.querySelector(".js-UserRank").innerHTML = allData.panelScores.filter(d => d.country === country && d.sector === sector)[0].rank
    })
  })
}

const resetQuestions = () => {
  const questionsEl = document.querySelector(".js-questions")

  while(questionsEl.firstChild){
    questionsEl.removeChild(questionsEl.firstChild);
  }
  questionsEl.innerHTML = `<p class="explainer">Click on indicator to view questions</p>`

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
    surveyIndicatorList.forEach((surveyIndicator) => {
      let component = framework.filter(d => d.indicator === surveyIndicator)[0].component
      let subComponent = framework.filter(d => d.indicator === surveyIndicator)[0].subComponent
      let indicatorData = countrySurveyData.filter(d => d.indicator === surveyIndicator)
      // if(country === "India"){
      //   console.log(indicatorData)
      // }
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
  const countrySectorList = [...new Set(indicatorScores.map(d => (d.country).concat("?").concat(d.sector)))]
  // const subComponentList = [...new Set(framework.map(d => d.subComponent))]
  const componentList = [...new Set(framework.map(d => d.component))]

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
      valueRealizationUser: 0,
      revenueManagementUser: 0,
      enablingEnvironmentUser: 0,
      indexScoreUser: 0,

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

/**
 * Draw the country indicator chart and render the questions
 * @function drawCountryChart
 * @param {string} selector - The id of the css selector for the indicator chart
 * @param {string} country - The name of the country being displayed
 * @param {string} sector - The name of the sector being displayed
 * @param {object} allData - All the datasets associated with the charts
 * @param {object} allScales - All the scales associated with the charts
 * @param {object} allChartVars - All the charting variables
 * @description given the selector and the charting variables plot the indicator chart
 */
const drawCountryChart = (selector, country, sector, allData, allScales, allChartVars) => {
  //Fill in the framework data
  //Create a dataset at the level of the indicator. Mark those that are absent as not covered to fill with grey
  const indicatorList = [...new Set(allData.framework.filter(d => d.component !== "Enabling environment").map(d => d.indicator))]
  const subComponentList = [...new Set(allData.framework.filter(d => d.component !== "Enabling environment").map(d => d.subComponent))]

  const chartData = indicatorList.reduce((data, indicator) => {
    const indiData = allData.indicatorScores.filter(d => d.country === country && d.sector === sector).filter(d => d.indicator === indicator)
    const score = indiData.length === 0 ? "Not Covered" : indiData[0].score

    const questions = [... new Set(allData.framework.filter(e => e.indicator === indicator).map(e => e.questionID))].reduce((accum, question) => {
        const questionScores = allData.allScores.filter(e => e.country === country && e.sector === sector).filter(e => e.questionID === question)
        const questionFrame = allData.framework.filter(e => e.questionID === question)
        const questionMetric = allData.scoringMetric.filter(e => e.questionID === question)
        let tempLabel = ""
        if(questionScores.length === 0) {
          const tempLabelData = questionMetric.filter(d => d.questionID === question && isNaN(parseFloat(d.score)))
          tempLabel = tempLabelData[tempLabelData.length - 1].label
        }
        accum.push({
          metric: questionMetric,
          questionID: question, 
          question: questionFrame[0].question,
          lawPractice: questionFrame[0].lawPractice,
          questionLabel: questionFrame[0].questionLabel,
          indicator: questionFrame[0].indicator,
          subComponent: questionFrame[0].subComponent,
          component: questionFrame[0].component,
          label: questionScores.length === 0 ? tempLabel : questionScores[0].label,
          score: questionScores.length === 0 ? "Not Covered" : questionScores[0].score,
          justification: questionScores.length === 0 ? "Not Covered" : questionScores[0].justification,
          newLabel: "",
          newScore: 0
          })
        return accum
      }, [])

    data.push({
      indicator, 
      score, 
      subComponent: allData.framework.filter(d => d.indicator === indicator)[0].subComponent, 
      component: allData.framework.filter(d => d.indicator === indicator)[0].component,
      userInput: false,
      userScore: 0,
      questions
    })
    return data
  }, [])

  const subComponentScores = [...new Set(allData.framework.filter(d => d.component !== "Enabling environment").map(d => d.subComponent))].reduce((data, subComponent) => {
    const scoreData = chartData.filter(e => e.subComponent === subComponent && e.score !== "Not Covered")
    const avgScore = scoreData.length === 0 ? "Not Covered" : scoreData.reduce((sum, indiScore) => { sum += parseFloat(indiScore.score); return sum}, 0)/scoreData.length

    data.push({subComponent, component: allData.framework.filter(d => d.subComponent === subComponent)[0].component, score: avgScore})
    return data
  }, [])

  //create the chart data with not covered as an option
  const indicatorChart = createSVG(selector, margin = {top: 0, right: 0, bottom: 0, left: 0}),
    indicatorWidth = indicatorChart.width,
    indicatorHeight = indicatorChart.height,
    indicatorSVG = indicatorChart.plotVar

  const indicatorYScale = d3.scaleBand()
      .rangeRound([0, indicatorHeight])
      .padding(0.1)
      .domain([...new Set(chartData.map(d => d.indicator))]);


  //on component label mouseover draw left border on the indicator chart
  const mouseOverComponent = (d) => {
    const nonIndiText = d3.selectAll(".indiText").filter(e => e.component !== d)
    const nonSubs = d3.selectAll(".subComponentLabels").filter(e => e.component !== d)
    const nonSubScores = d3.selectAll(".subScoreText").filter(e => e.component !== d)
    const nonComponent = d3.selectAll(".componentLabels").filter(e => e !== d)
    const nonIndiBars = d3.selectAll(".indiBars").filter(e => e.component !== d)
    

    nonIndiText.style("opacity", 0.2)
    nonSubs.style("opacity", 0.2)
    nonSubScores.style("opacity", 0.2)
    nonComponent.style("opacity", 0.2)
    nonIndiBars.style("opacity", 0.2)
  }
  //on component label mouseout remove left border on the indicator chart
  const mouseOutComponent = (d) => {
    const nonIndiText = d3.selectAll(".indiText").filter(e => e.component !== d)
    const nonSubs = d3.selectAll(".subComponentLabels").filter(e => e.component !== d)
    const nonSubScores = d3.selectAll(".subScoreText").filter(e => e.component !== d)
    const nonComponent = d3.selectAll(".componentLabels").filter(e => e !== d)
    const nonIndiBars = d3.selectAll(".indiBars").filter(e => e.component !== d)

    nonIndiText.style("opacity", 1)
    nonSubs.style("opacity", 1)
    nonSubScores.style("opacity", 1)
    nonComponent.style("opacity", 1)
    nonIndiBars.style("opacity", 1)
  }

  const mouseOverSub = (d) => {
    //select all those that are either not in the current clicked or moused over subcomponent group
    const nonIndiText = d3.selectAll(".indiText").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const nonSubs = d3.selectAll(".subComponentLabels").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const nonSubScores = d3.selectAll(".subScoreText").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const componentName = d.subComponent === "" ? "" : allData.framework.filter(e => e.subComponent === d.subComponent)[0].component
    const componentName2 = stateVars.subComponent === "" ? "" : allData.framework.filter(e => e.subComponent === stateVars.subComponent)[0].component
    const nonComponent = d3.selectAll(".componentLabels").filter(e => e !== componentName && e !== componentName2)
    const nonIndiBars = d3.selectAll(".indiBars").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)

    //select all those that are in the current clicked or moused over group
    const indiText = d3.selectAll(".indiText").filter(e => e.subComponent === d.subComponent || e.subComponent === stateVars.subComponent)
    const subs = d3.selectAll(".subComponentLabels").filter(e => e.subComponent === d.subComponent || e.subComponent === stateVars.subComponent)
    const subScores = d3.selectAll(".subScoreText").filter(e => e.subComponent === d.subComponent || e.subComponent === stateVars.subComponent)
    const component = d3.selectAll(".componentLabels").filter(e => e === componentName || e === componentName2)
    const indiBars = d3.selectAll(".indiBars").filter(e => e.subComponent === d.subComponent || e.subComponent === stateVars.subComponent)

    indiText.style("opacity", 1)
    subs.style("opacity", 1)
    subScores.style("opacity", 1)
    component.style("opacity", 1)
    indiBars.style("opacity", 1)

    nonIndiText.style("opacity", 0.2)
    nonSubs.style("opacity", 0.2)
    nonSubScores.style("opacity", 0.2)
    nonComponent.style("opacity", 0.2)
    nonIndiBars.style("opacity", 0.2)
  }
  const mouseOutSub = (d) => {
    //select all that are not currently mousedover or active
    const nonIndiText = d3.selectAll(".indiText").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const nonSubs = d3.selectAll(".subComponentLabels").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const nonSubScores = d3.selectAll(".subScoreText").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)
    const componentName = d.subComponent === "" ? "" : allData.framework.filter(e => e.subComponent === d.subComponent)[0].component
    const componentName2 = stateVars.subComponent === "" ? "" : allData.framework.filter(e => e.subComponent === stateVars.subComponent)[0].component
    const nonComponent = d3.selectAll(".componentLabels").filter(e => e !== componentName && e !== componentName2)
    const nonIndiBars = d3.selectAll(".indiBars").filter(e => e.subComponent !== d.subComponent && e.subComponent !== stateVars.subComponent)

  
    nonIndiText.style("opacity", 1)
    nonSubs.style("opacity", 1)
    nonSubScores.style("opacity", 1)
    nonComponent.style("opacity", 1)
    nonIndiBars.style("opacity", 1)
    
    if(stateVars.subComponent !== "") {
      mouseOverSub(stateVars)
    } 
    
  }
  //on indicator mouseover show tool tip with name of the indicator and subcomponent 
  //and change class on component label to show active
  const mouseOverIndicator = (d) => {
    //select all those that are either currently hovered on or clicked
    const clicked = stateVars.indicator
    const indiText = d3.selectAll(".indiText").filter(e => e.indicator === d.indicator || e.indicator === clicked)
    const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator === d.indicator || e.indicator === clicked)
    const indiTitle = document.querySelector(".js-indiTitle")

    // const nonIndiText = d3.selectAll(".indiText").filter(e => e.indicator !== d.indicator || e.indicator !== clicked)
    // const nonIndiRect = d3.selectAll(".indiBars").filter(e => e.indicator !== d.indicator || e.indicator !== clicked)
    

    indiText.style("stroke", "grey")
    indiRect.style("stroke", "black")
    indiTitle.innerHTML = d.indicator

    // nonIndiText.style("stroke", "none")
    // nonIndiRect.style("stroke", "none")
  }

  //on indicator mouseout remove tool tip and active class on component label
  const mouseOutIndicator = (d) => {
    //select all those that are currently active or clicked
    const clicked = stateVars.indicator
    const indiText = d3.selectAll(".indiText").filter(e => e.indicator !== clicked)
    const indiRect = d3.selectAll(".indiBars").filter(e => e.indicator !== clicked)// || e.indicator === clicked
    const indiTitle = document.querySelector(".js-indiTitle")
    
    indiTitle.innerHTML = ""
    indiText.style("stroke", "none")
    indiRect.style("stroke", "none")

    if(stateVars.indicator !== "") {
      mouseOverIndicator(stateVars)
    }
      
  }
  //onClick subComponent
  const onClickSub = (d) => {

    if(stateVars.subComponent === d.subComponent){ //double click
      stateVars.subComponent =  "" //reset state
      mouseOutSub(stateVars)
    } else {
      stateVars.subComponent = d.subComponent
      mouseOverSub(stateVars)
    }
  }

  //onClick Indicator
  const indiOnClick = (d, chartData) => {
    
    if(stateVars.indicator === d.indicator){ //reset the state var
      stateVars.indicator = "" //reset state
      mouseOutIndicator(stateVars)

      resetQuestions()
    } else {
      const clickedSub= allData.framework.filter(e => e.indicator === d.indicator)[0].subComponent//the corresponding subcomponent
     
      //do stuff
      stateVars.indicator = d.indicator;//update state
      mouseOutIndicator(stateVars) //activate stuff

      if(clickedSub !== stateVars.subComponent) {
        stateVars.subComponent =  clickedSub //update state
        mouseOverSub(stateVars) //activate sub component
      }

      renderQuestions(country, sector, d.indicator, chartData, allData, allScales, allChartVars) //render the questions
      
    }
  }

  const countryChart = indicatorSVG.append("g")
    .selectAll(".countryIndicators")
    .data(chartData)
    .enter()

  countryChart.append("g")
    .append("rect")
      .attr("class", "indiBars")
      .attr("x", 5 * indicatorWidth/7)
      .attr("y", d => indicatorYScale(d.indicator))
      .attr("width", indicatorWidth/10)
      .attr("height", indicatorYScale.bandwidth())
      .attr("fill", d => d.score === "Not Covered" ? "grey" : allScales.colorScale(d.score))
      .on("mouseover", mouseOverIndicator)
      .on("mouseout", mouseOutIndicator)
      .on("click", d=> indiOnClick(d, chartData))

  countryChart.append("g")
    .append("text")
      .attr("class", "indiText")
      .attr("x", 4.8 * indicatorWidth/7)
      .attr("y", d => indicatorYScale(d.indicator) + indicatorYScale.bandwidth()/2)
      .text(d => d.score === "Not Covered" ? "NA" : Math.round(d.score))
      .style("text-anchor", "end")
      .style("dominant-baseline", "middle")

  countryChart.append("g")
    .append("text")
      .attr("class", "changeText")
      .attr("x", 5.9 * indicatorWidth/7)
      .attr("y", d => indicatorYScale(d.indicator) + indicatorYScale.bandwidth()/2)
      .text(d => d.score === "Not Covered" ? "NA" : Math.round(d.score))
      .attr("opacity", 0)
      .style("text-anchor", "start")
      .style("dominant-baseline", "middle")

  //given a component or subcomponent find its position
  const findPos = (item, itemType) => {
    const allIndicators = chartData.filter(d => d[itemType] === item)
    const firstIndicator = d3.selectAll(".indiBars").filter(d => d.indicator === allIndicators[0].indicator).attr("y")
    const lastIndicator = d3.selectAll(".indiBars").filter(d => d.indicator === allIndicators[allIndicators.length - 1].indicator).attr("y")
    const barHeight = indicatorYScale.bandwidth()

    return (parseFloat(firstIndicator) + parseFloat(lastIndicator) + parseFloat(barHeight))/2
  }

  //draw the component and subcomponent labels
  const componentLabels = indicatorSVG.append("g")
    .selectAll(".componentLabels")
    .data(["Value realization", "Revenue management"])
    .enter()

  componentLabels.append("g")
    .append("text")
      .text(d => d)
      .attr("class", "componentLabels")
      .attr("transform", d => `translate(${0.5 * indicatorWidth/7}, ${findPos(d, 'component')}) rotate(270)`)
      .style("text-anchor", "middle")
      // .on("mouseover", mouseOverComponent)
      // .on("mouseout", mouseOutComponent)


  const subComponentLabels = indicatorSVG.append("g")
      .selectAll(".subComponentLabels")
      .data(subComponentScores)
      .enter()

  subComponentLabels.append("text")
      .attr("class", "subComponentLabels")
      .attr("x", 4 * indicatorWidth/7)
      .attr("y", d => findPos(d.subComponent, "subComponent"))
      .attr("dy", 0)
      .text(d => d.subComponent)
      .call(textwrap, 3.2 * indicatorWidth/7)
      .style("text-anchor", "end")
      .on("mouseover", mouseOverSub)
      .on("mouseout", mouseOutSub)
      .on("click", onClickSub)
  
      //generate the scores position (the y position needs to be calculated based on the labels wraps)
  const allSubs = Array.from(document.querySelectorAll(".subComponentLabels"))
  
  const scorePos = allSubs.reduce((accum, node, i) => {
    accum.push({
      userY:node.getBBox().y - 2,
      y: node.getBBox().y + node.getBBox().height + 7,
      score: subComponentScores[i].score,
      subComponent: subComponentScores[i].subComponent,
      component: subComponentScores[i].component
    })
    return accum;
  }, [])

  indicatorSVG.append("g")
    .selectAll(".subScoreText")
    .data(scorePos)
    .enter()
    .append("text")
    .attr("class", "subScoreText")
    .attr("x", 3 * indicatorWidth/7)
    .attr("y", d => d.y)
    .text(d => d.score ==="Not Covered" ? "NA" : Math.round(d.score))
    .style("fill", d => allScales.colorScale(d.score))
    .style("stroke", "lightgrey")
    .style("stroke-width", "0.1px")
    .attr("dominant-baseline", "middle")

  indicatorSVG.append("g")
    .selectAll(".userSubScore")
    .data(scorePos)
    .enter()
    .append("text")
    .attr("class", "userSubScore")
    .attr("x", 3 * indicatorWidth/7)
    .attr("y", d => d.userY)
    .text(d => d.score ==="Not Covered" ? "NA" : Math.round(d.score))
    .style("fill", d => allScales.colorScale(d.score))
    .style("stroke", "lightgrey")
    .style("stroke-width", "0.1px")
    .attr("opacity", 0)

  
  //draw strokes to separate the value realization and revenue management indicators
  const firstValue = allData.framework.filter((d) => d.component === "Value realization")[0].indicator;
  const firstRev = allData.framework.filter((d) => d.component === "Revenue management")[0].indicator;
  const lastRevPos = indicatorYScale(indicatorYScale.domain()[indicatorYScale.domain().length - 1]) + indicatorYScale.bandwidth()
  
  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 2*indicatorWidth/7)
      .attr("x2", 5*indicatorWidth/7)
      .attr("y1", indicatorYScale(firstValue))
      .attr("y2", indicatorYScale(firstValue))

  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 2*indicatorWidth/7)
      .attr("x2", 5*indicatorWidth/7)
      .attr("y1", indicatorYScale(firstRev) + 1)
      .attr("y2", indicatorYScale(firstRev) + 1)

  indicatorSVG
    .append("line")
      .attr("class", "indiLine")
      .attr("x1", 2*indicatorWidth/7)
      .attr("x2", 5*indicatorWidth/7)
      .attr("y1", lastRevPos)
      .attr("y2", lastRevPos)    
}


/**
 * Update the panel chart
 * @function panelUpdate
 * @param {object} xScale - The x-axis scale for the chart
 * @param {object} yScale - The y-axis scale for the chart
 * @param {object} colorScale - The colorScale for the bars
 * @description given the new panel data, update the charts and the labels
 */
const panelUpdate = (allScales, allChartVars) => {
  
  //Select all the label elements
  const labelText = d3.selectAll(".labelText")
  const sectorIcons = d3.selectAll(".sectorIcons")
  const lockIcons = d3.selectAll(".lockIcons")
  const rankCircles = d3.selectAll(".rankCircles")
  const rankText = d3.selectAll(".ranks")
  
  //update all label and sector text + icons: The only thing we need to change here is the y position, 
  //the names of the country or sector will never be updated
  labelText.transition().duration(250).attr("y", d => allScales.yScale(d.rank) + 1.2 * allChartVars.barWidth/2)
  sectorIcons.transition().duration(500).attr("y", d => allScales.yScale(d.rank))

  //Update all the rank text and circles: The rank text attr and y position are updated based on the new data.
  //The circles need to have new fill colors
  rankText.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .text((d) => stateVars.sortDirection === "ascending" ? d.rank : allChartVars.nRanks - d.rank + 1)//if sort direction is reverse then reverse the ranks
  rankCircles
      .attr("cy", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .style("stroke", d => allScales.colorScale(d[stateVars.sortBy]))

  //Update the lock icons: The only thing to update here is the y position of the lock icon
  lockIcons.transition().duration(500).attr("y", d => allScales.yScale(d.rank))    
  
  
  //Select all the panel bars and text
  const indexBars = d3.selectAll(".indexBars");
  const indexBarText = d3.selectAll(".indexText");
  const valueBars = d3.selectAll(".valueBars");
  const valueBarText = d3.selectAll(".valueText");
  const revenueBars = d3.selectAll(".revenueBars");
  const revenueBarText = d3.selectAll(".revenueText");
  const enablingBars = d3.selectAll(".enablingBars");
  const enablingBarText = d3.selectAll(".enablingText");
  
  
  indexBars.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.indexScore))
      .attr("fill", d => allScales.colorScale(d.indexScore))

  indexBarText.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .attr("x", d =>  allScales.xScale(d.indexScore))
      .text(d => Math.round(d.indexScore))

  valueBars.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.valueRealization))
      .attr("fill", d => allScales.colorScale(d.valueRealization))

  valueBarText.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .attr("x", d =>  allScales.xScale(d.valueRealization))
      .text(d => Math.round(d.valueRealization))

  revenueBars.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.revenueManagement))
      .attr("fill", d => allScales.colorScale(d.revenueManagement))

  revenueBarText.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .attr("x", d =>  allScales.xScale(d.revenueManagement))
      .text(d => Math.round(d.revenueManagement))
  
  enablingBars.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.enablingEnvironment))
      .attr("fill", d => allScales.colorScale(d.enablingEnvironment))

  enablingBarText.transition().duration(500)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .attr("x", d =>  allScales.xScale(d.enablingEnvironment))
      .text(d => Math.round(d.enablingEnvironment))
  //implemet a scroll if locked is on: http://bl.ocks.org/humbletim/5507619
  
  
  if(stateVars.lockedRank !== 0) {//a country is selected
    const mapping ={ //maps each ranking to the variable name used for scoring
      "indexScore": "2017 Overall Index",
      "valueRealization": "Value realization",
      "revenueManagement": "Revenue management",
      "enablingEnvironment": "Enabling environment"
      }
    //update the country blurb stuff
    const currRankBy = document.querySelector(".js-rankBy")
    const currRankEl = document.querySelector(".js-currRank")
    
    currRankBy.innerHTML = mapping[stateVars.sortBy]
    currRankEl.innerHTML = stateVars.lockedRank
  }

}

/**
 * Update the html content, lock a bar and show country level plot based on click
 * @function labelOnClick
 * @param {datum} d - the datum associated with the clicked node
 * @param {object} countryData - The data specific to that country i.e. its blurb and any additional values to pass in later
 * @param {object} indicatorScores - The scores for each indicator/country
 * @description when a label is clicked lock it and update the charts
 */
const labelOnClick = (d, allData, allScales, allChartVars) => {
  //reset everything before replot
  // allData.panelScores = computePanelData(allData.indicatorScores, allData.countryData, allData.framework)

  // //update the ranks
  // allData.panelScores = computeRanks(allData.panelScores, stateVars.sortBy)

  // // redraw panel
  // panelUpdate(allScales, allChartVars)

  let currRank = d.rank;
  //reset the previously selected indicator and subcomponent
  stateVars.indicator = ""
  stateVars.subComponent = ""

  //update the locked global rank
  if(currRank === stateVars.lockedRank){ //you click on the same country twice go back to default
    //reset locked rank to zero
    stateVars.lockedRank = 0;

    //clear initial view
    renderInitialView(initialBlurb);
  } else {
    stateVars.lockedRank = currRank;

    //trigger changes to the text
    renderCountryBlurb(d.country, d.alias, d.sector, allData, allScales)

    //render indicator chart
    drawCountryChart("#countryIndicators", d.country, d.sector, allData, allScales, allChartVars)
  }

  //select all the elements
  const lockIcons = d3.selectAll(".lockIcons");
  const allBars = d3.selectAll(".bars");
  const allBarText = d3.selectAll(".barText")
  const countryLabels = d3.selectAll(".countryLabels");
  const rankText = d3.selectAll(".ranks");
  const rankCircles = d3.selectAll(".rankCircles");


  //show the lock
  lockIcons.filter(e => e.rank === stateVars.lockedRank).style("opacity", 1);
  lockIcons.filter(e => e.rank !== stateVars.lockedRank).style("opacity", 0);

  //change the opacity on bars
  allBars.filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)//classed("notLocked", lockedRank === 0 ? false : true)
  allBars.filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  //change the opacity on bar text
  allBarText.filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)//classed("notLocked", lockedRank === 0 ? false : true)
  allBarText.filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  //change the opacity on labels
  countryLabels.filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)
  countryLabels.filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  //change the opacity on the rank text
  rankText.filter(e => e.rank === stateVars.lockedRank).style("opacity", 1)
  rankText.filter(e => e.rank !== stateVars.lockedRank).style("opacity", stateVars.lockedRank === 0 ? 1 : 0.2)

  //change the strokewidth opacity
  rankCircles.filter(e => e.rank === stateVars.lockedRank).style("stroke-opacity", 1)
  rankCircles.filter(e => e.rank !== stateVars.lockedRank).style("stroke-opacity", stateVars.lockedRank === 0 ? 1 : 0.2)
}

const drawLabels = (labelSVG, allData, allScales, allChartVars) => {
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

    //All tool tips
  const iconTip = d3.tip()
    .attr('class', 'd3-tip')
    .html(d => d.sector)

  const labelTip = d3.tip()
    .attr('class', 'd3-tip')


  //label svg and data
  const yLabels = labelSVG.append("g")
    .selectAll(".countryLabels")
      .data(allData.panelScores)
      .enter()

    //draw labels
  // yLabels.append("line")
  //   .attr("x1", 0)
  //   .attr("x2", labelSpace)
  //   .attr("y1", d => yScale(d.rank) + barWidth/2)
  //   .attr("y2", d => yScale(d.rank) + barWidth/2)
  //   .style("stroke", "lightgrey")

  yLabels.append("text")
      .attr("class", "countryLabels labelText")
      .attr("x", allChartVars.labelXPos)
      .attr("y", (d) => allScales.yScale(d.rank) + 1.2 * allChartVars.barWidth/2) //this is hardcoded relative to the font size. Should find a more elegant solution
      .text(d => allChartVars.labelXPos/12 < d.country.length ? d.alias : d.country)
      .attr("text-anchor", "end")
      .style("dominant-baseline", "middle")
      .call(labelTip)
      .on("mouseover", labelMouseOver)
      .on("mouseout", labelMouseOut)
      .on("click", d => labelOnClick(d, allData, allScales, allChartVars))

  yLabels.append("circle")
    .attr("class", "rankCircles")
    // .attr("cx", iconSize + 10 * iconPadding)
    .attr("cx", 10 * allChartVars.iconPadding)
    .attr("cy",d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
    .attr("r", allChartVars.barWidth/2)
    .style("stroke", d => allScales.colorScale(d[stateVars.sortBy]))
    .style("stroke-width", "1px")
    .attr("fill-opacity", 0.1)

  yLabels.append("text")
      .attr("class", "ranks")
      // .attr("x", iconSize + 10 * iconPadding)
      .attr("x", 10 * allChartVars.iconPadding)
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .text((d, i) => stateVars.sortDirection === "ascending" ? d.rank : nRanks - i)
      .style("dominant-baseline", "middle")
      .attr("text-anchor", "middle")

    //add the mining and oil-gas icons
  yLabels.append("svg:image")
      .attr("class", "sectorIcons")
      .attr("xlink:href", (d) => {return d.sector === "Mining" ? "/images/miningicon.svg" : "/images/oilGasicon.svg"})
      .attr("class", "countryLabels sectorIcons")
      .attr("width", allChartVars.iconSize)
      .attr("height", allChartVars.iconSize)
      .attr("x", allChartVars.labelXPos + allChartVars.iconPadding)
      .attr("y", (d) => allScales.yScale(d.rank))
      .call(iconTip)
      .on("mouseover", iconTip.show)
      .on("mouseout", iconTip.hide)

    //add the lock icon
  yLabels.append("svg:image")
      .attr("class", "lockIcons")
      .attr("xlink:href", "/images/unlock.svg")
      .attr("class", "lockIcons")
      .attr("width", allChartVars.iconSize)
      .attr("height", allChartVars.iconSize)
      .attr("x", allChartVars.iconSize + 10 * allChartVars.iconPadding)
      // .attr("x", iconPadding)
      .attr("y", (d) => allScales.yScale(d.rank))
      .attr("opacity", 0)
}

const drawPanel = (allSVGs, allData, allScales, allChartVars) => {
  const indexPanel = allSVGs.indexSVG.append("g")
      .selectAll(".bars")
      .data(allData.panelScores)
      .enter()

  indexPanel.append("g")
    .append("rect")
      .attr("class", "bars indexBars")
      .attr("x", 0)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.indexScore))
      .attr("height", allChartVars.barWidth)
      .attr("fill", d => allScales.colorScale(d.indexScore))

  indexPanel.append("g")
    .append("text")
      .attr("class", "barText indexText")
      .attr("x", d =>  allScales.xScale(d.indexScore))
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2) //position at the middle of the bars
      .text(d => Math.round(d.indexScore))
      .attr("text-anchor", d => allScales.xScale(d.indexScore) < 9 ? "start" : "end")
      .style("fill", d => d.indexScore < 30 && allScales.xScale(d.indexScore) >= 9 ? "lightgrey" : "black")
      .style("dominant-baseline", "middle")

  const valuePanel = allSVGs.valueSVG.append("g")
      .selectAll(".bars")
      .data(allData.panelScores)
      .enter()

  valuePanel.append("g")
    .append("rect")
      .attr("class", "bars valueBars")
      .attr("x", 0)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.valueRealization))
      .attr("height", allChartVars.barWidth)
      .attr("fill", d => allScales.colorScale(d.valueRealization))

  valuePanel.append("g")
    .append("text")
      .attr("class", "barText valueText")
      .attr("x", d => allScales.xScale(d.valueRealization))
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .text(d => Math.round(d.valueRealization))
      .attr("text-anchor", d => allScales.xScale(d.valueRealization) < 9 ? "start" : "end")
      .style("fill", d => d.valueRealization < 30 && allScales.xScale(d.valueRealization) >= 9 ? "lightgrey" : "black")
      .style("dominant-baseline", "middle")

  const revenuePanel = allSVGs.revenueSVG.append("g")
      .selectAll(".bars")
      .data(allData.panelScores)
      .enter()

  revenuePanel.append("rect")
      .attr("class", "bars revenueBars")
      .attr("x", 0)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.revenueManagement))
      .attr("height", allChartVars.barWidth)
      .attr("fill", d => allScales.colorScale(d.revenueManagement))

  revenuePanel.append("g")
    .append("text")
      .attr("class", "barText revenueText")
      .attr("x", d => allScales.xScale(d.revenueManagement))
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .text(d => Math.round(d.revenueManagement))
      .attr("text-anchor", d => allScales.xScale(d.revenueManagement) < 9 ? "start" : "end")
      .style("fill", d => d.revenueManagement < 30 && allScales.xScale(d.revenueManagement) >= 9 ? "lightgrey" : "black")
      .style("dominant-baseline", "middle")

  const enablingPanel = allSVGs.enablingSVG.append("g")
      .selectAll(".bars")
      .data(allData.panelScores)
      .enter()

  enablingPanel.append("rect")
      .attr("class", "bars enablingBars")
      .attr("x", 0)
      .attr("y", d => allScales.yScale(d.rank))
      .attr("width", d => allScales.xScale(d.enablingEnvironment))
      .attr("height", allChartVars.barWidth)
      .attr("fill", d => allScales.colorScale(d.enablingEnvironment))

  enablingPanel.append("g")
    .append("text")
      .attr("class", "barText enablingText")
      .attr("x", d => allScales.xScale(d.enablingEnvironment))
      .attr("y", d => allScales.yScale(d.rank) + allChartVars.barWidth/2)
      .text(d => Math.round(d.enablingEnvironment))
      .attr("text-anchor", d => allScales.xScale(d.enablingEnvironment) < 9 ? "start" : "end")
      .style("fill", d => d.enablingEnvironment < 30 && allScales.xScale(d.enablingEnvironment) >= 9 ? "lightgrey" : "black")
      .style("dominant-baseline", "middle")
}

/**
 * Draw the RGI scores
 * @function draw
 * @param {object} allScores - The entire set of scores for each question for each country
 * @param {object} allData.framework - The additional information required for each question, i.e. map to indicators, labels etc
 * @param {object} scoringMetric - The scoring metric for each question
 * @param {object} indicatorScores - The scores for each indicator. This was added since the questions do not address the Enabling Environment component
 * @description given an id an margin object, append an svg to DOM and return SVG characteristics
 */


const draw = (allScores = required(), framework = required(), scoringMetric = required(), countryData = required(), eeScores = required()) => {
  
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

  
  const allSVGs = {labelSVG, indexSVG, valueSVG, revenueSVG, enablingSVG}
  

  //GENERATE THE INITIAL DATA
  let indicatorScores = computeIndicatorData(allScores, eeScores, framework)
  let panelScores = computePanelData(indicatorScores, countryData, framework)
  
  //update the data for default plot that is sorted on overall index ranks
  panelScores = computeRanks(panelScores, stateVars.sortBy)

  const allData = {allScores, indicatorScores, panelScores, framework, scoringMetric, countryData, eeScores}

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
  const colorScale = d3.scaleThreshold()
    .range(["#A12A32", "#F78C4B", "#FEEF92", "#C1EDA2", "#75E180"])
    .domain([30, 44, 59, 74, 100])

  const allScales ={xScale, yScale, colorScale} //collect all the scale functions

    //Chart dimension controls
  const labelSpace = document.querySelector(".js-labels").clientWidth,
    barWidth = 0.6 * yScale.bandwidth(),
    iconPadding = 2,
    iconSize = barWidth,
    labelXPos = labelSpace - iconPadding * 2 - iconSize,
    nRanks = [... new Set(countryData.map(d => d.country + d.sector))].length


  const allChartVars = {labelSpace, barWidth, iconPadding, iconSize, labelXPos, nRanks} //collect all the charting

  drawLabels(labelSVG, allData, allScales, allChartVars)
  drawPanel(allSVGs, allData, allScales, allChartVars)
  

  //Label click event listener
    //Sort panel based on clicks on the label, update state variables
    //callback for the label click
  const sortScores = (event) => {
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
    panelUpdate(allScales, allChartVars)
  }
  
  //Bind the sort function on the label selection nodese
  const labelSel = document.querySelectorAll(".topLabel p")
  labelSel.forEach(node => node.addEventListener("click", sortScores))
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








