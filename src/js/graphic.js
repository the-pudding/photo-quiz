import Swiper from 'swiper';
import noUiSlider from 'nouislider'

let mySwiper = null;
let photoArray = null;
let startingNum = null;

let photoArrayMap;

let output = [];
let colorCrossWalk = {0:"bwFile",1:"colorFile"}
let photosSelected = [];

let currentPhoto = null;
/* global d3 */
function resize() {}



function swiperController(){
  d3.select(".start-slide").select(".black-button").on("click",function(d){
    mySwiper.slideNext();
  });

  d3.select(".age-slide").select(".black-button").on("click",function(d){
    let age = d3.select(this.parentNode).select("#age-slider").select(".noUi-tooltip").text().slice(-2);
    mySwiper.slideNext();
  });

  d3.selectAll(".photo-question").select(".photo-submit").on("click",function(d){
    let value = d3.select(this.parentNode).select(".photo-slider").select(".noUi-tooltip").text().slice(-2);
    currentPhoto.selected = value;
    mySwiper.slideNext();
  })
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
  let photoId = photoArray[startingNum].key;
  startingNum = startingNum + 1;
  if(startingNum = photoArray.length){
    startingNum = 0;
  }
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
            currentPhoto = {id:photoId,color:color};
        });
    }

    if (d3.select(".swiper-slide-active").classed("photo-question")){

      let photoId = selectPhoto();
      let color = getColor();
      let fileName = colorCrossWalk[color];

      let photoUrl = photoArrayMap.get(photoId)[fileName];
      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".swiper-slide-next").select(".photo-container")
        .each(function(d){
          d3.select(this).node().appendChild(img);
          currentPhoto = {id:photoId,color:color};
        });

    }

    if(d3.select(".swiper-slide-active").classed("quiz-begins")){
      d3.select(".answer-key").style("display","block").transition().duration(500).style("opacity",1);
    }


  });
}

function init(data) {

  photoArray = shuffle(data);
  startingNum = Math.floor(Math.random()*photoArray.length);


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

    let slider = noUiSlider.create(el, {
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
          'min': 1920,
          'max': 2020
      },
      pips: {
          mode:'values',
          values:[1920,1930,1940,1950,1960, 1970, 1980, 1990,2000,2010,2020],
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
        values: [1940,1950, 1960, 1970, 1980, 1990,2000,2010],
        density: 5
      }
  });

  buildAnswerKey();
  swiperController();
  slideChangeEvents();



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
