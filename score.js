var scoreScrollTimeout;
var scrollingScore;
var scoreScrollSpeed;
var scoreFontSize;
var scoreContainer = document.getElementById('score');
var scoreContent;

function Score(title, scale) {
  this.title = title;
  this.scale = scale;
  this.transpose = 0;
  this.blocks = new Array();
}

function Block() {
  this.parts = new Array();
}

function Part(name) {
  this.name = name;
  this.bars = new Array();
}

function Bar() {
  this.notes = new Array();
}

function Note(value, length) {
  this.value = value;
  // Length as percentage of a bar.
  this.length = length;
  this.getDisplayValue = function() {
    return this.value;
  }
}

Note.prototype = new Note();

function Chord(root, tone, on) {
  Note.call(this, root + tone + (on ? '/' + on : ''));
  this.root = root;
  this.tone = tone;
  this.on = on;
  this.getDisplayValue = function() {
    var t = transposeChord(score.scale, this, score.transpose);
    return t.root + t.tone + (t.on ? '/' + t.on : '');
  }
}


function onClickScore() {
  if (scrollingScore) {
    stopScrollScore();
  } else {
    startScrollScore();
  }
}

function startScrollScore() {
  scrollingScore = true;
  scrollScore();
}

function stopScrollScore() {
  scrollingScore = false;
  clearTimeout(scoreScrollTimeout);
}

function scrollScore() {
  if (scrollingScore) {
    window.scrollBy(0,1);
    scoreScrollTimeout = setTimeout(scrollScore, scoreScrollSpeed);
  }
}

function setScoreFontSize(n) {
  scoreContainer.style.fontSize = n + "em";
  scoreFontSize = n;
  setScoreScrollSpeed(document.getElementById('scoreScrollSpeed').value);
}

function setScoreScrollSpeed(n) {
  scoreScrollSpeed = 500 / n / scoreFontSize;
}

function setScoreKeyTranspose(offset) {
  if (offset < -11 || offset > 11) return;
  score.transpose = offset;
  document.getElementById('scoreKeyTranspose').innerText = offset;
  renderScore(score);
}

function loadScore(name) {
  var client = new XMLHttpRequest();
  client.open('GET', name);
  client.onreadystatechange = function() {
    console.log(client.responseText);
  }
  client.send();
}

function parseScore(scoreStr) {
  // Treat more than 1 empty lines as block separater.
  var score = new Score();
  scoreStr.split(/\n\n+/).forEach(b => score.blocks.push(parseBlock(b)));
  return score;
}

function parseBlock(blockStr) {
  // Each block contains multiple parts.
  var block = new Block();
  blockStr.split('\n').forEach(p => block.parts.push(parsePart(p)));
  return block;
}

function parsePart(partStr) {
  // Use the first characters up to a white space as part class.
  var headerIndex = partStr.indexOf(' ');
  var partName = partStr.substr(0, headerIndex);
  partName = partName === '##' ? 'Header' : partName;
  var part = new Part(partName);
  partStr.substr(headerIndex).split('|').map(b => b.trim()).filter(b => b)
    .map(b => b === '_' ? '' : b)
    .map(b => parseBar(partName, b))
    .forEach(b => part.bars.push(b));
  return part;
}

function parseBar(partName, barStr) {
  // C, Em
  var bar = new Bar();
  if ('Ch' === partName) {
    var chords = barStr.split(',');
    chords.forEach(c => {
      var chord = parseChord(c);
      chord.length = 100 / chords.length;
      bar.notes.push(chord);
    });
  } else {
    bar.notes.push(new Note(barStr, 100));
  }
  return bar;
}

function parseChord(s) {
  var onChord = s.split('/');
  var chord = onChord[0];
  var on = onChord[1];
  var root = chord.charAt(0);
  var accidental = chord.charAt(1);
  var toneIndex = 1;
  if ('#' === accidental || 'b' === accidental) {
    root += accidental;
    toneIndex = 2;
  }
  var tone = chord.substr(toneIndex);
  
  return new Chord(root, tone, on);
}

// C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B
var rootToNum = new Map([
  ['C', 0],
  ['C#', 1],
  ['Db', 1],
  ['D', 2],
  ['D#', 3],
  ['Eb', 3],
  ['E', 4],
  ['F', 5],
  ['F#', 6],
  ['Gb', 6],
  ['G', 7],
  ['G#', 8],
  ['Ab', 8],
  ['A', 9],
  ['A#', 10],
  ['Bb', 10],
  ['B', 11]
]);

var numToRoot = new Map([
  [0, 'C'],
  [1, 'C#'],
  [2, 'D'],
  [3, 'D#'],
  [4, 'E'],
  [5, 'F'],
  [6, 'F#'],
  [7, 'G'],
  [8, 'G#'],
  [9, 'A'],
  [10, 'A#'],
  [11, 'B']
]);


// offset -11 0 11
function transposeRoot(root, offset) {
  if (!root) return undefined;
  var num = rootToNum.get(root);
  var transposedNum = (num + offset) % 12;
  transposedNum = transposedNum < 0 ? transposedNum + 12 : transposedNum;
  var transposedRoot = numToRoot.get(transposedNum);
  return transposedRoot;
}

function transposeChord(baseScale, chord, offset) {
  // TODO: pick the right accidental based on transposedBase.
  var transposedBaseRoot = transposeRoot(baseScale.root, offset); 
  var transposedChordRoot = transposeRoot(chord.root, offset); 

  var transposedBase = new Chord(transposedBaseRoot, baseScale.tone, undefined);
  var transposedChord = new Chord(transposedChordRoot, chord.tone, transposeRoot(chord.on, offset));
  return transposedChord;
}

function renderScore(score) {
  // remove existing children.
  scoreContent = document.getElementById('scoreContent');
  if (scoreContent) scoreContainer.removeChild(scoreContent);
  scoreContent = document.createElement('div');
  scoreContent.id = 'scoreContent';
  scoreContainer.appendChild(scoreContent);
  score.blocks.forEach((b, i) => renderBlock(scoreContent, b, i));
}

function renderBlock(scoreContent, block, blockIdx) {

  var maxBarLen = block.parts.map(part => part.bars.length).reduce((a, b) => Math.max(a, b));
  var blockContainer = document.createElement('div');
  blockContainer.className = 'block';

  if ('Header' === block.parts[0].name) {
    blockContainer.className += ' block-header';
  }

  var barContainers = new Array(maxBarLen);
  for (var i = 0; i < barContainers.length; i++) {
    barContainers[i] = document.createElement('div');
    barContainers[i].className = 'bar';
    blockContainer.appendChild(barContainers[i]);
  }

  scoreContent.appendChild(blockContainer);
  block.parts.forEach((p, i) => renderPart(barContainers, p, i));
}

function renderPart(barContainers, part, partIdx) {
  part.bars.forEach((b, i) => renderBar(barContainers[i], part.name, b, i, partIdx));
}

function renderBar(barContainer, partName, bar, barIdx, partIdx) {
  var partContainer = document.createElement('div');
  partContainer.className = 'part part-' + partName;
  barContainer.appendChild(partContainer);
  // partContainer.innerText = barIdx + '.' + partIdx + ':' + bar;
  bar.notes.forEach(n => {
    var noteDiv = document.createElement('div');
    noteDiv.innerText = n.getDisplayValue();
    noteDiv.className = 'note-' + n.length;
    partContainer.appendChild(noteDiv);
  });
}

function setBarClasses(classes) {
  var bars = document.getElementsByClassName('bar');
  for (var i = 0; i < bars.length; i++) {
    bars[i].className = classes;
  }
}

setScoreFontSize(document.getElementById('scoreFontSize').value);
setScoreScrollSpeed(document.getElementById('scoreScrollSpeed').value);

