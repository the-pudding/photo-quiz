import Swiper from 'swiper';
import noUiSlider from 'nouislider'

let mySwiper = null;

let photoArray = [
  {"id":1,url:"1.png"},
  {"id":2,url:"1.png"}
];

let photoArrayMap;

let output = [];
let photosSelected = [];
/* global d3 */
function resize() {}



function swiperController(){
  d3.select(".start-slide").select(".black-button").on("click",function(d){
    mySwiper.slideNext();
  });

  d3.select(".age-slide").select(".black-button").on("click",function(d){
    mySwiper.slideNext();
  });

  d3.selectAll(".photo-question").select(".photo-submit").on("click",function(d){
    mySwiper.slideNext();
  })
}

function selectPhoto(){

  let scale = d3.scaleQuantize().domain([0,1]).range(d3.extent(photoArray,function(d){return d.id;}));
  let photoId = scale(Math.random());
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
      let photoUrl = photoArrayMap.get(photoId).url;
      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".quiz-begins").select(".photo-container")
        .each(function(d){
            d3.select(this).node().appendChild(img);
        });
    }

    if (d3.select(".swiper-slide-active").classed("photo-question")){

      console.log("here");

      let photoId = selectPhoto();
      let photoUrl = photoArrayMap.get(photoId).url;
      var img = new Image();
      img.src="assets/images/"+photoUrl;

      d3.select(".swiper-slide-next").select(".photo-container")
        .each(function(d){
          d3.select(this).node().appendChild(img);
        });

    }

    if(d3.select(".swiper-slide-active").classed("quiz-begins")){
      d3.select(".answer-key").style("display","block").transition().duration(500).style("opacity",1);
    }


  });
}

function init() {

  photoArrayMap = new Map(photoArray.map(function(d){
    return [d.id,d];
  }));

  mySwiper = new Swiper ('.swiper-container', {
    slidesPerView:1,
    simulateTouch:false,
    touchStartPreventDefault:false,
    allowTouchMove:false,
  })

  d3.selectAll(".photo-slider").each(function(d,i){
    let el = d3.select(this).node();

    noUiSlider.create(el, {
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

export default { init, resize };
