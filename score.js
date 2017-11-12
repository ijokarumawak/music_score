var scoreScrollTimeout;
var scrollingScore;
var scoreScrollSpeed;
var scoreFontSize;
var scoreContainer = document.getElementById('score');

function Score(title) {
  this.title = title;
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
    var notes = barStr.split(',');
    notes.map(n => new Note(n, 100 / notes.length)).forEach(n => bar.notes.push(n));
  } else {
    bar.notes.push(new Note(barStr, 100));
  }
  return bar;
}

function renderScore(score) {
  // TODO: remove existing children.
  score.blocks.forEach((b, i) => renderBlock(scoreContainer, b, i));
}

function renderBlock(scoreContainer, block, blockIdx) {

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

  scoreContainer.appendChild(blockContainer);
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
    noteDiv.innerText = n.value;
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

