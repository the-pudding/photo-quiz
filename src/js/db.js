/* global d3 */
import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';

const DEV = false;
let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function formatDecimal(d) {
  return d3.format('.2f')(d);
}

function getAnswer(id) {
  if (userData.answers) return userData.answers[id];
  return null;
}

function getAnswers() {
  if (userData.answers)
    return userData.answers;
    // return Object.keys(userData.answers)
    //   .map(k => userData.answers[k])
    //   .map(d => ({ ...d, min: +d.min, max: +d.max }));
  return null;
}

function getAnswerCount() {
  return Object.keys(userData.answers).length;
}

function hasAnswers() {
  return !!Object.keys(userData.answers).length;
}

function getReturner() {
  return userData.returner;
}

function getSeenResults() {
  return userData.results;
}

function setResults() {
  userData.results = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_photo_results', 'true');
}

function setReturner() {
  userData.returner = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_photo_returner', 'true');
}

function setupUserData() {
  if (hasStorage) {
    let id = window.localStorage.getItem('pudding_photo_id');
    if (!id) {
      id = generateID({ chron: true, numbers: false });
      console.log(id);
      window.localStorage.setItem('pudding_photo_id', id);
    }

    let answers = window.localStorage.getItem('pudding_photo_answers');
    answers = answers ? JSON.parse(answers) : null;
    //
    // const returner = window.localStorage.getItem('pudding_laugh_returner');
    // const results = window.localStorage.getItem('pudding_laugh_results');

    //return { id, answers, returner, results };
    return { id, answers };

  }

  // const newID = generateID({ chron: true, numbers: false });
  // window.localStorage.setItem('pudding_photo_id', newID);
  // return { id: newID, answers: {}, returner: false };
}

function connect() {
  // Initialize Firebase
  const config = {
    apiKey: 'AIzaSyC5nYqwl5Q_Qsnb6h5Leu-2Gj6Pdl-X6JQ',
    authDomain: 'photo-quiz-b9ac7.firebaseio.com',
    databaseURL: 'https://photo-quiz-b9ac7.firebaseio.com/',
    projectId: 'photo-quiz-b9ac7',
  };
  firebaseApp = firebase.initializeApp(config);
  firebaseDB = firebaseApp.database();
  connected = true;
}

function clear() {
  console.log("clearing");
  localStorage.removeItem('pudding_photo_id');
  localStorage.removeItem('pudding_photo_answers');
}

function setup() {
  //if (window.location.host.includes('localhost')) clear();
  userData = setupUserData();
  if(!connected){
    if (!userData.finished) connect();
    console.log("connected");
  }
  console.log({ userData });
}

function closeConnection() {
  if (connected)
    firebaseApp.delete().then(() => {
      connected = false;
    });
}

function finish() {
  userData.finished = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_photo_finished', 'true');
  closeConnection();
}

function getSubmissions(data) {
  const output = {};
  Object.keys(data).forEach(d => {
    const g = data[d];
    // add to submit list
    if (g.store === 'true') output[d] = g;
  });
  return output;
}

function update(output) {
  // userData.answers[key] = {
  //   key,
  //   order,
  //   min: min ? formatDecimal(min) : '1.00',
  //   max: max ? formatDecimal(max) : '5.00',
  //   store: min && max ? 'true' : 'false',
  // };
  userData.answers = output
  console.log(hasStorage);
  if (hasStorage)
    window.localStorage.setItem(
      'pudding_photo_answers',
      JSON.stringify(userData.answers)
    );

  if (!DEV && connected) {
    firebaseDB
      // .ref(id)
      .ref(userData.id)
      .set({ output })
      .then(() => {
        // console.log('saved');
      })
      .catch(console.log);
  }
}

export default {
  setup,
  update,
  finish,
  getAnswer,
  getAnswers,
  getSeenResults,
  setResults,
  clear,
  hasAnswers,
  setReturner,
  getReturner,
  getAnswerCount,
  closeConnection,
};
