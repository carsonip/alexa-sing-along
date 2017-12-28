'use strict';
const Alexa = require('alexa-sdk');
const utils = require('./utils.js');
const solfa = require('./solfa.js');
const APP_ID = process.env.APP_ID;  // TODO replace with your app ID (OPTIONAL).

const states = {
    ANSWER: '_ANSWER',
}

const BASE_URL = process.env.BASE_URL;
const CHUNK_MAX_SIZE = 5;
const MAX_DIFFICULTY = 10;
const POSITIVE_SENTENCE = [
    'You\'ve got it! ',
    'That\'s right! ',
    'Impressive! ',
];
const NEGATIVE_SENTENCE = [
    'Woops! Try again! ',
    'Oh no! Try again! ',
    'That\'s incorrect! Try again! ',
];
const DOE_REFERENCE = 'This is doe. ' + getAudioTag('d');
const LISTEN = 'Now listen to the rhythm. ';


function getAudioTagsFromRhythm(rhythm) {
    var result = rhythm.split('').chunk(CHUNK_MAX_SIZE).map(x => x.join('')).map(getAudioTag).join('')
    return result;
}

function getAudioTag(audioName) {
    return `<audio src="${BASE_URL}${audioName}.mp3"></audio>`;
}

function play(ssmlContent, useOldRhythm) {
    this.attributes['difficulty'] = this.attributes['difficulty'] || 1;
    ssmlContent = ssmlContent || '';

    if (!useOldRhythm || !this.attributes['rhythm']) {
        var rhythm = '';
        for (var i = 0; i < this.attributes['difficulty']; i++) {
            rhythm += utils.randomItem(solfa.SOLFA_NAMES);
        }
        this.attributes['rhythm'] = rhythm;
    }

    ssmlContent += DOE_REFERENCE + LISTEN + getAudioTagsFromRhythm(this.attributes['rhythm']);
    ssmlContent += 'Can you repeat the rhythm using sol-fa names? '

    var reprompt = 'You can now repeat the rhythm using sol-fa names, or you can say, repeat, to listen to the rhythm again. '

    this.handler.state = states.ANSWER;

    this.emit(':ask', ssmlContent, reprompt);
}

function answer(solfaSentence) {
    solfaSentence = solfaSentence || '';
    var solfaWords = solfaSentence.split(' ');
    var rhythm = solfaWords.map(solfa.solfaWordToSolfa).join('');
    
    var isCorrect = rhythm == this.attributes['rhythm'];
    var ssmlContent = isCorrect ?
        utils.randomItem(POSITIVE_SENTENCE) : utils.randomItem(NEGATIVE_SENTENCE);
    
    if (isCorrect) {
        this.attributes['difficulty'] = Math.min((this.attributes['difficulty'] || 0) + 1, MAX_DIFFICULTY);
        play.call(this, ssmlContent)
    } else {
        this.attributes['difficulty'] = Math.max(this.attributes['difficulty'] - 1, 1);
        this.emit(':ask', ssmlContent, 'You can now sing out the rhythm using sol-fa names, or you may say, play again, if you need to listen to the rhythm again.');
    }
}

var handlers = {
    'LaunchRequest': function () {
        this.emit('AMAZON.HelpIntent');
    },
    'Play': function () {
        play.call(this);
    },
    'PlayAgain': function () {
        play.call(this, '', true);
    },
    'MoreHelp': function () {
        var speechOutput = `For example, when you hear ${getAudioTag('d')} you should say, Doe. 
        And when you hear ${getAudioTag('smd')} you should say, 'Sew, Me, Doe'. The difficulty increases as you get better. Good luck!
        Say start, to begin the game.`
        var reprompt = 'Say start, to begin the game.';
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = `Welcome to Sing Along! This skill will play a rhythm, and you should repeat it using sol-fa names. 
        Say play, to begin the game, or you can say, explain, to know more.`;
        var reprompt = 'Say start, to begin the game, or you can say, explain, to know more.';
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye');
    },
    'Unhandled': function () {
        const speechOutput = 'I don\'t understand that. Say, help, for help.'
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended: ${this.event.request.reason}`);
    },
};

var answerHandlers = Alexa.CreateStateHandler(states.ANSWER, Object.assign({
    'Answer': function () {
        answer.call(this, getAllSolfaNameSlots.call(this));
    },
}, handlers));

function getAllSolfaNameSlots() {
    var list = [];
    for (var i=0;i<15;i++) {
        var val = this.event.request.intent.slots['SolfaName' + String.fromCharCode(65+i)].value;
        if (val)
            list.push(val);
    }
    return list.join(' ');
}

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // TODO: i18n
    // To enable string internationalization (i18n) features, set a resources object.
    // alexa.resources = languageStrings;
    alexa.registerHandlers(handlers, answerHandlers);
    alexa.execute();
};