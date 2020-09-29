import Swiper from 'swiper';
import noUiSlider from 'nouislider'

let mySwiper = null;
/* global d3 */
function resize() {}

function swiperController(){
  d3.select(".start-slide").select(".black-button").on("click",function(d){
    mySwiper.slideNext();
  });
}

function init() {

  mySwiper = new Swiper ('.swiper-container', {
    slidesPerView:1,
    simulateTouch:false,
    touchStartPreventDefault:false,
    allowTouchMove:false,
  })

  noUiSlider.create(d3.select("#age-slider").node(), {
    start: [20, 80],
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
  });

  swiperController();

}

export default { init, resize };
