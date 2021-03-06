// IMPORTS
import Swiper from 'swiper';
import noUiSlider from 'nouislider'
import db from './db';
import locate from './utils/locate';
import Cursor from './cursor';
import Grid from './grid';
import { preloadImages } from './utils/photo-intro-utils';

//VARIABLES
let isInUS = false;
let hasExistingData = null;
let mySwiper = null;
let photoArray = null;
let startingNum = null;
let age = null;
let currentQuestion = 1;
let colorCrossText = {0:"black and white",1:"color"}
let slider = null;
let sliderAge = null;
let finished = false;
let allReaderData = null;
let allReaderDataNest = null;
let colorCrossWalk = {0:"bwFile",1:"colorFile"}
let photosSelected = [];
let currentPhoto = null;
let nextPhoto = null;

// DATA
let photoArrayMap;
let actualDates = { 1:2006,2:1963,3:1969,4:2007,5:1940,6:1977,7:1976,8:1987,9:1970,10:1946 }
let output = [];

// DOM ELEMENTS
const $openerButton = d3.select('#opener-button')
const $resultsButton = d3.select('#results-button')
const $ageButton = d3.select(".age-slide").select(".black-button")
const $photoButton = d3.selectAll(".photo-question").select(".photo-submit")
const $ageSlider = d3.select("#age-slider").node()

// SCREEN SIZE ADJUSTMENTS
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)

let yearValues = [1920,1930,1940,1950,1960, 1970, 1980, 1990,2000,2010,2019];
if(vw < 500){ yearValues = [1920,1940,1960, 1980,2000,2019]; }

let ageValues = [1940,1950, 1960, 1970, 1980, 1990,2000,2010];
if(vw < 500){ ageValues = [1940,1963,1985,2010]; }

/* global d3 */
function resize() {}

function answerKeyUpdate(answer){
  let rows = d3.select(".answer-key").selectAll(".row");
  rows
    .filter(function(d,i){ return i == currentQuestion - 1; })
    .select(".box")
    .classed("active",false)
    .classed("filled-in",true)
    .html(function(d,i){ return "&rsquo;"+answer; })

    rows
      .filter(function(d,i){ return i == currentQuestion - 1; })
      .select(".count")
      .classed("active-count",false)

  rows
    .filter(function(d,i){ return i == currentQuestion; })
    .select(".box")
    .classed("active",true)
  
  rows
    .filter(function(d,i){ return i == currentQuestion; })
    .select(".count")
    .classed("active-count",true)
}

function swiperController(){
  $openerButton.on("click",function(d){
    mySwiper.slideNext();
    d3.select('.photo-bg').style('display', 'none')
  });

  $resultsButton.on('click', function(d) {
    mySwiper.slideTo(7)
    d3.select('.photo-bg').style('display', 'none')
    d3.select(".all-done").style("height","auto")
    output = db.getAnswers();
    buildFinalSlide()
    d3.selectAll('.pudding-footer').style('display', 'block')
    d3.selectAll('.down-arrow').classed('is-visible', true)
  })

  sliderAge.on('change', function(d) {
    $ageButton.classed('is-disabled', false)
    d3.selectAll('.noUi-handle').style('animation-play-state', 'paused')
  })

  $ageButton.on("click",function(d){
    age = d3.select(this.parentNode).select("#age-slider").select(".noUi-tooltip").text().slice(-2);
    currentPhoto = nextPhoto;
    mySwiper.slideNext();
  });

  $photoButton.on("click",function(d){
    let value = d3.select(this.parentNode).select(".photo-slider").select(".noUi-tooltip").text().slice(-2);
    currentPhoto.selected = value;
    answerKeyUpdate(value);
    output.push(currentPhoto);

    if(d3.select(".swiper-slide-active").classed("last-question")){
      if (!finished && isInUS) db.update({"year":age,"answers":output});
      buildFinalSlide();
      d3.select(".all-done").style("height","auto");
    }

    currentQuestion = currentQuestion + 1;
    mySwiper.slideNext();

    if(currentQuestion == 6) {
      d3.selectAll('.down-arrow').classed('is-visible', true)
      d3.selectAll('.pudding-footer').style('display', 'block')
    }
  })
}

function buildResults(data, belongsTo) {
  let container = d3.select(`.photo-answer-wrapper-${belongsTo}`);

  let photoAnswers = container.selectAll("div").data(data).enter().append("div").attr("class","photo-answer");
  let photoAnswerTitleWrapper = photoAnswers.append("div").attr("class","photo-answer-title-wrapper");

  // Adds photo titles
  if (belongsTo == 'yours') {
    photoAnswerTitleWrapper.append("p").attr("class","photo-answer-title").html(function(d,i){ return "Photo No. <span>"+(i+1)+"</span>"; })

    photoAnswerTitleWrapper.append("div").datum(function(d,i){ return i; })
      .attr("class","photo-answer-key")
      .selectAll("div")
      .data(data)
      .enter()
      .append("div")
      .attr("class","photo-answer-key-box")
      .classed("photo-answer-key-box-active",function(d,i){
        if(i==d3.select(this.parentNode).datum()){ return true }
        return false;
      });
  }

  // Adds a color and bw row for each photo
  let photoAnswersRow = photoAnswers.append("div")
    .attr("class","photo-answer-row-wrapper")
    .selectAll("div")
    .data(function(d,i){
      let colorQuizzed = +d.color;
      let grouped = d3.groups(allReaderDataNest.get(+d.id), t => +t.color).sort(function(a,b){ return b[0]-a[0]; });
      return grouped;
    })
    .enter()
    .append("div")
    .attr("class","photo-answer-row")
    .classed("your-guess-row",function(d){
      let colorQuizzed = +d3.select(this.parentNode).datum().color;
      if(belongsTo == 'yours' && d[0] == colorQuizzed){ return true; }
      return false;
    })
    .classed("color-row",function(d){
      if (belongsTo == 'others' && d[0] == 1) { return true }
      return false;
    })
    .classed("bw-row",function(d){
      if(d[0] == 0){ return true; }
      return false;
    });
  
  // Calculate and display average text 
  let photoAnswerText = photoAnswersRow.append("p").attr("class","photo-answer-text-wrapper")
  let averagesCalculated = new Map();

  photoAnswerText.each(function(d,i){
    let topRow = false;
    if(i==0){ topRow = true }

    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let colorQuizzed = rowData.color;

    let avg = Math.floor(d3.mean(d[1],function(d){
      let year = 1900;
      if(+d.selected < 20){ return +d.selected+2000; }
      return +d.selected + 1900;
    }));

    let guessedDate = +rowData.selected;
    if(guessedDate < 20){ guessedDate = guessedDate+2000; }
    else { guessedDate = guessedDate + 1900; }

    averagesCalculated.set(rowData.id+"_"+d[0],avg)
  })

  photoAnswerText.html(function(d){
    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let id = +rowData.id;

    let avgBw = averagesCalculated.get(id+"_0");
    let avgColor = averagesCalculated.get(id+"_1");
    let diffVal = Math.abs(avgBw - avgColor)
    let plural = "years";
    if(diffVal == 1) { plural = 'year'; }
    if(d3.select(this.parentNode).classed("bw-row")){
      if (avgBw > avgColor) {
        return `On average, people who saw this photo in black and white dated it ${diffVal} ${plural} <span>newer</span> than people who saw it in color.`
      }
      else if (avgBw < avgColor) {
        return `On average, people who saw this photo in black and white dated it ${diffVal} ${plural} <span>older</span> than people who saw it in color.`
      }
      return `On average, people who saw this photo in black and white dated it the <span>same</span> year as people who saw it in color.`
    }
    return null;
  })

  // Append photos
  photoAnswersRow.append("div").attr("class","photo-answer-photo").style("background-image",function(d,i){
    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let fileName = colorCrossWalk[d[0]];
    return "url(assets/images/"+photoArrayMap.get(rowData.id)[fileName]+")";
  })
  .attr('alt', function() { 
    const rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    const { alt } = photoArray.find(p => p.key === rowData.id);
    return alt;
  })
  .classed("color-version",function(d){
    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let color = d[0];
    if(color == 1){ return true; }
    return false;
  })

  // Append sliders
  let photoAnswerSliderContainer = photoAnswersRow.append("div").attr("class","photo-answer-slider-container")
  let photoAnswerSlider = photoAnswerSliderContainer.append("div").attr("class","photo-answer-slider").each(function(d){

  let orient = "horizontal";
  if(vw < 751){ orient = "vertical"; }

    let slider = noUiSlider.create(d3.select(this).node(), {
      start: [1920],
      step:1,
      tooltips: true,
      orientation: orient,
      disabled: true,
      format: {
        from: Number,
        to: function(value) {
          return "&rsquo;".concat(JSON.stringify(value).slice(-2));
        }
      },
      range: {
          'min': 1920,
          'max': 2020
      },
      pips: {
          mode:'values',
          values:[1920,1940,1960, 1980,2000,2020],
          density: 2
        }
    });
  });

  //slider.setAttribute('disabled', true);

  let scale = d3.scaleLinear().domain([1920,2020]).range([0,100])

  let actualBar = photoAnswerSliderContainer.append("div").attr("class","actual-bar")
    .style("left",function(d,i){
      if(vw < 751){ return null; }
      let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
      let actualDate = actualDates.get(+rowData.id);
      return scale(actualDate)+"%";
    })
    .style("top",function(d,i){
      if(vw < 751){
        let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
        let actualDate = actualDates.get(+rowData.id);
        return scale(actualDate)+"%";
      }
      return null;
    })

  // Append dots
  let dotWrapper = photoAnswerSlider.append("div").attr("class","dot-wrapper");

  // Append your dot
  if (belongsTo == 'yours') {
    let dotYou = dotWrapper
    .filter(function(d){
      if(d3.select(this.parentNode.parentNode.parentNode).classed("your-guess-row")){ return d; };
    })
    .append("div")
    .attr("class","dot-big dot-you")
    .style("left",function(d){
      if(vw < 751){ return null; }
      let you = +d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).datum().selected;
      if(you < 20){ return scale(you+2000)+"%"; }
      return scale(you + 1900)+"%";
    })
    .style("top",function(d){
      if(vw < 751){
        let you = +d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).datum().selected;
        if(you < 20){ return scale(you+2000)+"%"; }
        return scale(you + 1900)+"%";
      }
      return null;
    })
    ;

    dotYou.append("p").html(function(d){
      let you = +d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).datum().selected;
      if(+you < 20){ you = (+you)+2000; }
      else { you = +you + 1900; }
      return "<span>You</span>"+you;
    })
  }

  // Apended all faded dots
  dotWrapper.append("div").attr("class","faded-dots-wrapper")
    .selectAll("div")
    .data(function(d){ 
      let dotLen = d[1].length
      let dotData = d[1]
      let dotSubset = dotData.slice((dotLen - 100), dotLen)
      return dotSubset 
    })
    .enter()
    .append("div")
    .attr("class","faded-dot")
    .style("left",function(d,i){
      if(vw < 751){ return null; }
      let value = +d.selected;
      if(value < 20){ value = value+2000; }
      else { value = value + 1900 }
      return scale(value)+"%";
    })
    .style("top",function(d,i){
      if(vw < 751){
        let value = +d.selected;
        if(value < 20){ value = value+2000; }
        else { value = value + 1900 }
        return scale(value)+"%";
      }
      return null;
    })

  // Append average dot
  let dotAvg = dotWrapper.append("div")
  .attr("class","dot-big dot-avg")
  .style("left",function(d){
    if(vw < 751){ return null; }
    let avg = Math.floor(d3.mean(d[1],function(d){
      let year = 1900;
      if(+d.selected < 20){ return +d.selected+2000; }
      return +d.selected + 1900;
    }));
    return scale(avg)+"%";
  })
  .style("top",function(d){
    if(vw < 751){
      let avg = Math.floor(d3.mean(d[1],function(d){
        let year = 1900;
        if(+d.selected < 20){ return +d.selected+2000; }
        return +d.selected + 1900;
      }));
      return scale(avg)+"%";
    }
    return null;

  });

  dotAvg.append("p").html(function(d){
    let avg = Math.floor(d3.mean(d[1],function(d){
      let year = 1900;
      if(+d.selected < 20){ return +d.selected+2000; }
      return +d.selected + 1900;
    }));
    return "<span>Avg</span>"+avg;
  })  

  // Append actual date
  let secondRow = photoAnswersRow.filter(function(d,i){
    if(i!=0){ return d; }
  })

  secondRow
    .select(".actual-bar").append("div")
    .attr("class","actual-bar-background");

  secondRow
    .select(".actual-bar").append("div")
    .attr("class","actual-bar-info")
    .html(function(d){
      let actualDate = actualDates.get(+d3.select(this.parentNode.parentNode.parentNode.parentNode).datum().id);
      return '<p>'+actualDate+'</p><p>Actual date taken</p>'
    });
  
  // Change intro sentence
  if (belongsTo == 'yours') {
    d3.select(".yourColorspace").text(function(d) {
      if (colorCrossText[+data[0].color] == 'color') { return `in ${colorCrossText[+data[0].color]}` }
      else { return `digitally altered ${colorCrossText[+data[0].color]}` }
    });
  
    d3.select(".otherColorspace").text(function(){
      let color = +data[0].color;
      if(color == 1){ return `digitally altered ${colorCrossText[color-1]}` }
      return colorCrossText[color+1];
    });
  }
}

function buildFinalSlide(){
  //let container = d3.select(".photo-answer-wrapper-your");
  let results = output;
  const others = d3.range(10).map(d => {
    const id = `${d + 1}`;
    const match = output.find(o => o.id === id);
    if (!match) return { id };
    return null;
  }).filter(d => d);

  buildResults(results, "yours")
  buildResults(others, "others")
}

function setupDB() {
  db.setup();
  finished = !!db.getFinished()
  
  if (true) {
  locate().then(data => {
      isInUS = data.country === 'US';
    db.setUS(isInUS);
    }).catch(err => {
      isInUS = false;
      db.setUS(isInUS );
    });
  }
}


function getColor(){
  let rand = Math.random();
  if(rand > .5){ return 0; }
  else { return 1; }
}

function selectPhoto(){
  startingNum = startingNum + 1;

  if(startingNum == photoArray.length - 1 || startingNum == photoArray.length){ startingNum = 0; }

  let photoId = photoArray[startingNum].key;
  let altText = photoArray[startingNum].alt

  photosSelected.push(photoId);
  return  photoId;
}

function selectAltText(){

  if(startingNum == photoArray.length - 1 || startingNum == photoArray.length){ startingNum = 0; }

  let altText = photoArray[startingNum].alt

  return altText;
}

function buildAnswerKey(){
  let container = d3.select(".answer-key")

  let rows = container.selectAll(".row").data(
      d3.range(d3.selectAll(".photo-question").size())
    ).enter()
    .append("div")
    .attr("class","row");

  let boxes = rows.append("div").attr("class","box")
    .classed("active",function(d,i){
      if(i==0){ return true; }
      return false;
    })
  let count = rows.append("p").attr("class","count").text(function(d,i){ return "No. "+(i+1);})
    .classed('active-count', function(d,i) {
    if(i==0){ return true; }
    return false;
  })
}

function slideChangeEvents(){
  mySwiper.on('slideChangeTransitionEnd', function () {
    d3.selectAll('.noUi-handle').style('animation-play-state', 'initial')

    if(d3.select(".swiper-slide-active").classed("before-quiz-begins")){

      let photoId = selectPhoto()
      let altText = selectAltText()
      let color = getColor();
      let fileName = colorCrossWalk[color];
      let photoUrl = photoArrayMap.get(photoId)[fileName];

      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".quiz-begins").select(".photo-container")
        .each(function(d){
            let $photoContainter = d3.select(this)
            $photoContainter.node().appendChild(img);
            let photo = $photoContainter.select('img')
            photo.attr('alt', altText)
            //console.log("loading next photo");
            nextPhoto = {id:photoId,color:color};
        });
    }

    if (d3.select(".swiper-slide-active").classed("photo-question")){

      currentPhoto = nextPhoto;
      let photoId = selectPhoto()
      let altText = selectAltText()
      let color = getColor();
      let fileName = colorCrossWalk[color];

      let photoUrl = photoArrayMap.get(photoId)[fileName];
      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".swiper-slide-next").select(".photo-container")
        .each(function(d){
          let $photoContainter = d3.select(this)
          $photoContainter.node().appendChild(img);
          let photo = $photoContainter.select('img')
          photo.attr('alt', altText)
          nextPhoto = {id:photoId,color:color};
        });
    }

    if(d3.select(".swiper-slide-active").classed("quiz-begins")){
      d3.select(".answer-key").style("display",null).transition().duration(500).style("opacity",1);
    }

    if(d3.select(".swiper-slide-active").classed("all-done")){
      d3.select(".answer-key").style("display","none").transition().duration(500).style("opacity",1);
    }
  });
}

function showReturnScreen() {
  if (finished) {
    $openerButton.text('Take the quiz again')
    $resultsButton.classed('is-visible', true)
  }
}

function init(data) {
  preloadImages('.grid__item-img').then(() => {
    // Remove loader (loading class)
    document.body.classList.remove('loading');

    // Initialize grid
    const grid = new Grid(document.querySelector('.grid'));
  });

  allReaderData = data[1];
  delete allReaderData.columns;
  allReaderDataNest = d3.group(allReaderData, v => +v.id);

  photoArray = shuffle(data[0]);
  startingNum = Math.floor(Math.random()*photoArray.length);
  actualDates = new Map(data[0].map(function(d,i){ return [+d.key,+d.year] }))

  photoArrayMap = new Map(photoArray.map(function(d){ return [d.key,d]; }));

  mySwiper = new Swiper ('.swiper-container', {
    slidesPerView:1,
    simulateTouch:false,
    touchStartPreventDefault:false,
    allowTouchMove:false,
  })

  d3.selectAll(".photo-slider").each(function(d,i){
    let el = d3.select(this).node();
    let start = d3.range(1930,2000,1)[Math.floor(Math.random()*70)];

    slider = noUiSlider.create(el, {
      start: [start],
      step:1,
      tooltips: true,
      format: {
        from: Number,
        to: function(value) {
          return "&rsquo;".concat(JSON.stringify(value).slice(-2));
        }
      },
      range: {
          'min': 1920,
          'max': 2019
      },
      pips: {
          mode:'values',
          values:yearValues,
          density: 2
        }
    });
    d = slider;

    el.noUiSlider.on('change', function(d) {
      d3.selectAll('.swiper-slide-active').select('.photo-submit').classed('is-disabled', false)
      d3.selectAll('.noUi-handle').style('animation-play-state', 'paused')
    })
  })

  let ageStart = d3.range(1940,2010,1)[Math.floor(Math.random()*70)];

  sliderAge = noUiSlider.create($ageSlider, {
    start: [ageStart],
    step:1,
    tooltips: true,
    format: {
      from: Number,
      to: function(value) {
        return "&rsquo;".concat(JSON.stringify(value).slice(-2));
      }
    },
    range: {
      'min': 1940,
      'max': 2010
    },
    pips: {
      mode: 'values',
      values: ageValues,
      density: 5
    }
  });

  buildAnswerKey();
  swiperController();
  slideChangeEvents();
  setupDB();
  showReturnScreen();
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

window.onscroll = function() {
	if (d3.selectAll('.down-arrow').classed('is-visible') == true) {
		d3.selectAll('.down-arrow').classed('is-visible', false)
	}
}
export default { init, resize };
