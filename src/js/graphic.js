import Swiper from 'swiper';
import noUiSlider from 'nouislider'
import db from './db';

let hasExistingData = null;
let mySwiper = null;
let photoArray = null;
let startingNum = null;
let age = null;
let currentQuestion = 1;
let colorCrossText = {0:"black and white",1:"color"}

let photoArrayMap;

let actualDates = {
1:2006,2:1963,3:1969,4:2007,5:1940,6:1977,7:1976,8:1987,9:1970,10:1946
}

let output = [];

let allReaderData = null;
let allReaderDataNest = null;
let colorCrossWalk = {0:"bwFile",1:"colorFile"}
let photosSelected = [];

let currentPhoto = null;
let nextPhoto = null;

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)

let yearValues = [1920,1930,1940,1950,1960, 1970, 1980, 1990,2000,2010,2019];
if(vw < 500){
  yearValues = [1920,1940,1960, 1980,2000,2019];
}

let ageValues = [1940,1950, 1960, 1970, 1980, 1990,2000,2010];
if(vw < 500){
  ageValues = [1940,1963,1985,2010];
}
/* global d3 */
function resize() {}

function answerKeyUpdate(answer){
  let rows = d3.select(".answer-key").selectAll(".row");
  rows
    .filter(function(d,i){
      return i == currentQuestion - 1;
    })
    .select(".box")
    .classed("active",false)
    .classed("filled-in",true)
    .html(function(d,i){
      return "&rsquo;"+answer;
    })

  rows
    .filter(function(d,i){
      return i == currentQuestion;
    })
    .select(".box")
    .classed("active",true);
}

function swiperController(){
  d3.select(".start-slide").select(".black-button").on("click",function(d){
    mySwiper.slideNext();
  });

  d3.select(".age-slide").select(".black-button").on("click",function(d){
    age = d3.select(this.parentNode).select("#age-slider").select(".noUi-tooltip").text().slice(-2);
    currentPhoto = nextPhoto;
    mySwiper.slideNext();
  });

  d3.selectAll(".photo-question").select(".photo-submit").on("click",function(d){

    let value = d3.select(this.parentNode).select(".photo-slider").select(".noUi-tooltip").text().slice(-2);
    currentPhoto.selected = value;
    answerKeyUpdate(value);
    output.push(currentPhoto);

    if(d3.select(".swiper-slide-active").classed("last-question")){
      db.update({"year":age,"answers":output});
      buildFinalSlide();
      d3.select(".all-done").style("height","auto");
    }

    currentQuestion = currentQuestion + 1;
    mySwiper.slideNext();
  })
}

function buildFinalSlide(){

  let container = d3.select(".photo-answer-wrapper");
  let results = output;//[
  // let results = [
  // {color: "1", id: "7", selected: "56"},
  // {color: "1", id: "6", selected: "65"},
  // {color: "1", id: "5", selected: "47"},
  // {color: "1", id: "2", selected: "12"},
  // {color: "0", id: "4", selected: "01"}]

  let photoAnswers = container.selectAll("div").data(results).enter().append("div").attr("class","photo-answer");

  let photoAnswerTitleWrapper = photoAnswers.append("div").attr("class","photo-answer-title-wrapper");

  photoAnswerTitleWrapper.append("p").attr("class","photo-answer-title").html(function(d,i){
    return "Photo No. <span>"+(i+1)+"</span>";
  })

  photoAnswerTitleWrapper.append("div").datum(function(d,i){
      return i;
    })
    .attr("class","photo-answer-key")
    .selectAll("div")
    .data(results)
    .enter()
    .append("div")
    .attr("class","photo-answer-key-box")
    .classed("photo-answer-key-box-active",function(d,i){
      if(i==d3.select(this.parentNode).datum()){
        return true
      }
      return false;
    })
    ;

  let photoAnswersRow = photoAnswers.append("div")
    .attr("class","photo-answer-row-wrapper")
    .selectAll("div")
    .data(function(d,i){
      let colorQuizzed = +d.color;
      let grouped = d3.groups(allReaderDataNest.get(+d.id), t => +t.color).sort(function(a,b){
        return a[0]-b[0];
      });
      return grouped;
    })
    .enter()
    .append("div")
    .attr("class","photo-answer-row")
    .classed("your-guess-row",function(d){
      let colorQuizzed = +d3.select(this.parentNode).datum().color;
      if(d[0] == colorQuizzed){
        return true;
      }
      return false;
    })
    ;

  let photoAnswerText = photoAnswersRow.append("div").attr("class","photo-answer-text-wrapper")

  let averagesCalculated = new Map();

  photoAnswerText.html(function(d,i){

    let topRow = false;
    if(i==0){
      topRow = true
    }

    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let colorQuizzed = rowData.color;



    let avg = Math.floor(d3.mean(d[1],function(d){
      let year = 1900;
      if(+d.selected < 20){
        return +d.selected+2000;
      }
      return +d.selected + 1900;
    }));


    let guessedDate = +rowData.selected;
    if(guessedDate < 20){
      guessedDate = guessedDate+2000;
    }
    else {
      guessedDate = guessedDate + 1900;
    }

    averagesCalculated.set(rowData.id+"_"+d[0],avg)

    if(d3.select(this.parentNode).classed("your-guess-row")){
      return '<p><span class="you-button button">you</span> saw this photo in <span>'+colorCrossText[colorQuizzed]+'</span> and thought it was taken in <span>'+guessedDate+'</span>. On <span class="avg-button button">average</span>, other people who saw this photo in <span>'+colorCrossText[colorQuizzed]+'</span> said it was taken in <span>'+avg+'</span>.</p>';
    }
    else {
      return '<p>On <span class="avg-button button">average</span>, other people who saw this photo in <span>'+colorCrossText[d[0]]+'</span> said it was taken in <span>'+avg+'</span>.</p>';
    }
  })

  console.log(averagesCalculated);

  photoAnswersRow.append("div").attr("class","photo-answer-photo").style("background-image",function(d,i){
    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let fileName = colorCrossWalk[d[0]];
    return "url(assets/images/"+photoArrayMap.get(rowData.id)[fileName]+")";
  })
  .classed("color-version",function(d){
    let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
    let color = d[0];
    if(color == 1){
      return true;
    }
    return false;
  })

  let photoAnswerSliderContainer = photoAnswersRow.append("div")
    .attr("class","photo-answer-slider-container")

  let photoAnswerSlider = photoAnswerSliderContainer.append("div")
    .attr("class","photo-answer-slider").each(function(d){
    let slider = noUiSlider.create(d3.select(this).node(), {
      start: [1920],
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
          'max': 2020
      },
      pips: {
          mode:'values',
          values:[1920,1940,1960, 1980,2000,2020],
          density: 2
        }
    });
  });

  let scale = d3.scaleLinear().domain([1920,2020]).range([0,100])

  let actualBar = photoAnswerSliderContainer.append("div").attr("class","actual-bar")
    .style("left",function(d,i){
      let rowData = d3.select(this.parentNode.parentNode.parentNode).datum();
      let actualDate = actualDates.get(+rowData.id);
      return scale(actualDate)+"%";
    })

  let dotWrapper = photoAnswerSlider.append("div")
    .attr("class","dot-wrapper");

  dotWrapper
    .filter(function(d){
      if(d3.select(this.parentNode.parentNode.parentNode).classed("your-guess-row")){
        return d;
      };
    })
    .append("div")
    .attr("class","dot-big dot-you")
    .style("left",function(d){
      let you = +d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).datum().selected;
      if(you < 20){
        return scale(you+2000)+"%";
      }
      return scale(you + 1900)+"%";
    })
    ;

  dotWrapper.append("div").attr("class","faded-dots-wrapper")
    .selectAll("div")
    .data(function(d){
      return d[1]
    })
    .enter()
    .append("div")
    .attr("class","faded-dot")
    .style("left",function(d,i){
      let value = +d.selected;
      if(value < 20){
        value = value+2000;
      }
      else {
        value = value + 1900
      }
      return scale(value)+"%";
    })

  dotWrapper.append("div")
    .attr("class","dot-big dot-avg")
    .style("left",function(d){
      let avg = Math.floor(d3.mean(d[1],function(d){
        let year = 1900;
        if(+d.selected < 20){
          return +d.selected+2000;
        }
        return +d.selected + 1900;
      }));
      return scale(avg)+"%";
    })
    ;

  let secondRow = photoAnswersRow.filter(function(d,i){
      if(i!=0){
        return d;
      }
    })

  secondRow
    .select(".actual-bar").append("p")
    .attr("class","actual-bar-info")
    .html(function(d){
      let actualDate = actualDates.get(+d3.select(this.parentNode.parentNode.parentNode.parentNode).datum().id);

      return '<p>'+actualDate+'</p><p>Actual date taken</p>'
    });
    ;

  d3.select(".yourColorspace").text(colorCrossText[+results[0].color]);
  d3.select(".yourYear").text(function(d){
    let year = +results[0].selected;
    if(year < 20){
      return 2000+year;
    }
    return 1900+year;
  });

  d3.select(".yearDiff").text(function(d){
    let year = +results[0].selected;
    if(year < 20){
      return Math.abs(actualDates.get(+results[0].id) - (2000+year)) + " years";
    }
    return Math.abs(actualDates.get(+results[0].id) - (1900+year)) + " years";
  });

  d3.select(".actualYear").text(actualDates.get(+results[0].id));

  d3.select(".avgYear").text(function(d){
    let year = +results[0].selected;
    if(year < 20){
      return Math.abs(averagesCalculated.get(+results[0].id+"_"+results[0].color) - (2000+year)) + " years";
    }
    return Math.abs(averagesCalculated.get(+results[0].id+"_"+results[0].color) - (1900+year)) + " years";
  });

  d3.select(".otherColorspace").text(function(){
    let color = +results[0].color;
    if(color == 1){
      console.log(colorCrossText[color-1]);
      return colorCrossText[color-1]
    }
    return colorCrossText[color+1];
  });







}

function setupDB() {
  db.setup();
  const answers = db.getAnswers();
  if(answers){
    // hasExistingData = true;
    //
    // yearSelected = answers["year"];
    // genSelected = getGeneration(yearSelected);
    //
    // d3.select(".new-user").style("display","none")
    // d3.select(".old-user").style("display","flex")
    // d3.selectAll(".old-bday").text(yearSelected);
    //
    // answers["answers"].forEach(function(d){
    //   dbOutput.push(d);
    //   let songInfo = uniqueSongMap.get(d.key);
    //   songOutput.push({"song_url":songInfo.song_url,"key":d.key,"artist":songInfo.artist,"title":songInfo.title,"text":answersKey[d.answer].text,"answer":d.answer,"year":songInfo.year})
    // })
    //remove this when staging live
    // quizOutput();
    // updateOnCompletion();
  }
}


function getColor(){
  let rand = Math.random();
  if(rand > .5){
    return 0;
  }
  else {
    return 1;
  }
}

function selectPhoto(){

  // let scale = d3.scaleQuantize().domain([0,1]).range(d3.extent(photoArray,function(d){return d.key;}));
  // let photoId = scale(Math.random());
  startingNum = startingNum + 1;

  if(startingNum == photoArray.length - 1 || startingNum == photoArray.length){
    startingNum = 0;
  }

  let photoId = photoArray[startingNum].key;

  console.log(photoArray);

  photosSelected.push(photoId);
  return photoId;
}

function buildAnswerKey(){
  let container = d3.select(".answer-key")

  let rows = container.selectAll(".row").data(
      d3.range(d3.selectAll(".photo-question").size())
    ).enter()
    .append("div")
    .attr("class","row")
    ;

  let boxes = rows.append("div").attr("class","box")
    .classed("active",function(d,i){
      if(i==0){
        return true;
      }
      return false;
    })
  let count = rows.append("p").attr("class","count").text(function(d,i){
    return "No. "+(i+1);
  })
}

function slideChangeEvents(){


  mySwiper.on('slideChangeTransitionEnd', function () {

    if(d3.select(".swiper-slide-active").classed("before-quiz-begins")){

      let photoId = selectPhoto();
      let color = getColor();
      let fileName = colorCrossWalk[color];

      let photoUrl = photoArrayMap.get(photoId)[fileName];

      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".quiz-begins").select(".photo-container")
        .each(function(d){
            d3.select(this).node().appendChild(img);
            console.log("loading next photo");
            nextPhoto = {id:photoId,color:color};
        });
    }

    if (d3.select(".swiper-slide-active").classed("photo-question")){

      currentPhoto = nextPhoto;

      let photoId = selectPhoto();
      let color = getColor();
      let fileName = colorCrossWalk[color];

      let photoUrl = photoArrayMap.get(photoId)[fileName];
      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".swiper-slide-next").select(".photo-container")
        .each(function(d){
          d3.select(this).node().appendChild(img);
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

function init(data) {


  allReaderData = data[1];
  delete allReaderData.columns;
  allReaderDataNest = d3.group(allReaderData, v => +v.id);

  photoArray = shuffle(data[0]);
  startingNum = Math.floor(Math.random()*photoArray.length);
  actualDates = new Map(data[0].map(function(d,i){
    return [+d.key,+d.year]
  }))

  photoArrayMap = new Map(photoArray.map(function(d){
    return [d.key,d];
  }));

  mySwiper = new Swiper ('.swiper-container', {
    slidesPerView:1,
    simulateTouch:false,
    touchStartPreventDefault:false,
    allowTouchMove:false,
  })

  d3.selectAll(".photo-slider").each(function(d,i){
    let el = d3.select(this).node();

    let start = d3.range(1930,2000,1)[Math.floor(Math.random()*70)];

    let slider = noUiSlider.create(el, {
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
    //d.slider = slider;
  })

  noUiSlider.create(d3.select("#age-slider").node(), {
    start: [1985],
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
  // buildFinalSlide();
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


export default { init, resize };
