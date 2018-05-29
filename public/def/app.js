var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var cols;
var rows;
var xoffset;
var yoffset;
var graph;
var points = [];
var BLOCKEDPERCENT = 0;
var paused = false;
var yVelocity = 0;
var xVelocity = 0;
var stepSpeed = 2000;
var drawSpeed = stepSpeed / 150;
var drawint = null;
var stepint = null;
var diagonal_state = false;
var tor_state = false;
var step = 0;

if (typeof console == 'undefined') var console = { log: function () { } };

function onload() {
    console.log('Page loaded.');
    // Listener to block/unblock node.
    canvas.addEventListener("click", canvasClick, false);
}

$('#drawbutton').on('click', function () {
    cleanup();
    document.getElementById('points').innerHTML = '';
    document.getElementById('points').hidden = 'true';
    pathFinding();
});

// Delete all points, but keep graph structure intact.
$('#updatebutton').on('click', function () {
    points = []; 
    document.getElementById('points').innerHTML = '';
    document.getElementById('points').hidden = true;
    pathFinding();
});

$('#savebutton').on('click', function () {
    graph.download();
});

$('#pausebutton').on('click', function () {
    pause();
});

$('#newpoint').on('click', function () {
    var fromN = parseInt(document.getElementById('fromN').value);
    var fromM = parseInt(document.getElementById('fromM').value);
    var toN = parseInt(document.getElementById('toN').value);
    var toM = parseInt(document.getElementById('toM').value);
    var delay = parseInt(document.getElementById('delaybox').value);
    // AddPath returns true if adding point was successful.
    if (addPath(fromN, fromM, toN, toM, delay)) {
        document.getElementById('points').hidden = false;
        document.getElementById('points').innerHTML = '';
        document.getElementById('points').appendChild(makeUL(points));
    }
    document.getElementById('fromN').value = '';
    document.getElementById('fromM').value = '';
    document.getElementById('toM').value = '';
    document.getElementById('toN').value = '';
    document.getElementById('delaybox').value = '';
    draw();
});

$('#randomgraph').on('click', function () {
    var minlen = parseInt(document.getElementById('minlen').value);
    var amount = parseInt(document.getElementById('amount').value);
    var delay = parseInt(document.getElementById('delay').value);
    // randomgr returns true if creating random graph was successfeull.
    if (randomgr(minlen, amount, delay)) {
        document.getElementById('points').hidden = false;
        document.getElementById('points').innerHTML = '';
        document.getElementById('points').appendChild(makeUL(points));
    }
    document.getElementById('minlen').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('delay').value = '';
    draw();
});

//Main function
//Probably should rename it.
function pathFinding() {
    // If there is no graph - CREATE IT! 
    if (!graph || graph == null) {
        rows = parseInt(document.getElementById('nimput').value);
        cols = parseInt(document.getElementById('minput').value);
        BLOCKEDPERCENT = parseFloat(document.getElementById('BLOCKEDPERCENT').value);
        if (rows > 0 && cols > 0 && BLOCKEDPERCENT >= 0 && BLOCKEDPERCENT <= 1) {
            graph = createGraph(rows, cols, BLOCKEDPERCENT);
			// Yeah, recursion isn't good
            pathFinding();
        }
    }
    else {
		//Create those noce chart with Chart.js library.
        createCharts();
        drawSpeed = Math.ceil(drawSpeed);
		// If not paused call draw every "drawSpeed" miliseconds, something around 10.
        drawint = setInterval(function () { paused ? 0 : draw(); }, drawSpeed);
		// If not paused move points to next node, add data to charts every "stepSpeed" miliseconds, 2000.
        stepint = setInterval(function () {
            if (!paused) {
                movepoints();
                charting();
                step++;
                console.log("step " + step);
            }
            document.getElementById('points').hidden = false;
            document.getElementById('points').innerHTML = '';
            document.getElementById('points').appendChild(makeUL(points));
        }, stepSpeed); //2000
    }
}

function createCharts() {
    var chartx1 = document.getElementById("myChart1").getContext('2d');
    var chartx2 = document.getElementById("myChart2").getContext('2d');
    var chartx3 = document.getElementById("myChart3").getContext('2d');
    myChartx1 = new Chart(chartx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Load',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    myChartx2 = new Chart(chartx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'avg speed drop',
                data: [],
                backgroundColor: [
                    'rgba(80, 220, 100, 0.2)'
                ],
                borderColor: [
                    'rgba(80, 220, 100 , 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        } 
    });
    myChartx3 = new Chart(chartx3, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'lost',
                backgroundColor: 'rgba(255,0,0,0.2)',
                borderColor: 'rgba(255,0,0,1)',
                data: [
                ],
                fill: false,
            }, {
                label: 'cons',
                fill: false,
                backgroundColor: 'rgba(0,0,255,0.2)',
                borderColor: 'rgba(0,0,255,1)',
                data: [

                ],
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function charting() {
    var avgspeed = 0;
    var cons = 0;
    var pointsOnField = 0;
    loses = 0;
    for (let i = 0; i < points.length; i++) {
        if (points[i].delay < 1 && !points[i].ended) {
            pointsOnField++;
            avgspeed += Math.round(100 * points[i].path.length / (points[i].path.length + points[i].lost)) / 100;;
        }
        loses += points[i].lost;
        cons += points[i].con
    }
    avgspeed /= pointsOnField;
    addData(myChartx1, step, pointsOnField / graph.nodes.length);
    addData(myChartx2, step, (1 - avgspeed) * -1);
    addDataMultiple(myChartx3, step, loses , cons);

    function addData(chart, label, data) {
        chart.data.labels.push(label);
        chart.data.datasets.forEach((dataset) => {
            dataset.data.push(data);
        });
        chart.update();
    }
    
    function addDataMultiple(chart, label, data1 , data2) {
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(data1);
        chart.data.datasets[1].data.push(data2);
        chart.update();
    }
}

function movepoints() {
    graph.nodes.forEach(e => {
        e.bids = [];
    });

    
    for (let i = 0; i < points.length; i++) {
        if (points[i].delay > 0) {
            points[i].delay--;
            continue;
        }
        points[i].x = points[i].tox;
        points[i].y = points[i].toy;
        points[i].xc = points[i].toxc;
        points[i].yc = points[i].toyc;

        /*if (points[i].path[points[i].currstp + 1])
            graph.grid[points[i].path[points[i].currstp + 1].x][points[i].path[points[i].currstp + 1].y].bids.push(i);
        else
            points[i].currstp++*/
    }
    
    for (let i = 0; i < points.length; i++) {
        if (points[i].delay > 0) {
            points[i].delay--;
            continue;
        }
        points[i].x = points[i].tox;
        points[i].y = points[i].toy;
        points[i].xc = points[i].toxc;
        points[i].yc = points[i].toyc;

        if (points[i].path[points[i].currstp + 1])
            graph.grid[points[i].path[points[i].currstp + 1].x][points[i].path[points[i].currstp + 1].y].bids.push(i);
        else
            points[i].currstp++
    }
    graph.nodes.forEach(e => {
        var i = null;
        if (e.bids.length == 1) {
            i = e.bids[0];
        }
        if (e.bids.length > 1) {
            i = e.bids[Math.floor(e.bids.length * Math.random())];
            for (let c = 0; c < e.bids.length; c++) {
                points[e.bids[c]].con++
                console.log('kek');
                e.bids[c] != i ? points[e.bids[c]].lost++ : 0;
            }
        }
        if (i != null) {
            points[i].tox = points[i].path[points[i].currstp + 1].x;
            points[i].toy = points[i].path[points[i].currstp + 1].y;
            points[i].toxc = points[i].tox * (xoffset) + xoffset / 2;
            points[i].toyc = points[i].toy * (yoffset) + yoffset / 2;
            points[i].currstp++;
        }
    })
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLinks(graph);
    drawPath(points);
    drawPoints();
    drawGraph(graph);
    drawNames(graph);
    animatepoints();

    function drawPath(points) {
        points.forEach(pth => {
            for (let i = 0; i < pth.path.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(pth.path[i].x * (xoffset) + xoffset / 2, pth.path[i].y * (yoffset) + yoffset / 2);
                ctx.lineTo(pth.path[i + 1].x * (xoffset) + xoffset / 2, pth.path[i + 1].y * (yoffset) + yoffset / 2);
                ctx.strokeStyle = pth.color;
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.closePath();
            }
        });
    }
    
    function drawLinks(graph) {
        for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].weight > 0) {
                var xcord = graph.nodes[i].x * (xoffset) + xoffset / 2;
                var ycord = graph.nodes[i].y * (yoffset) + yoffset / 2;
                var neigh = graph.neighbors(graph.nodes[i]);
                for (let i = 0; i < neigh.length; i++) {
                    if (neigh[i].weight > 0) {
                        ctx.beginPath();
                        ctx.moveTo(xcord, ycord);
                        ctx.lineTo(neigh[i].x * (xoffset) + xoffset / 2, neigh[i].y * (yoffset) + yoffset / 2);
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
        }
    }
    
    function drawNames(graph) {
        for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].weight > 0) {
                var xcord = graph.nodes[i].x * (xoffset) + xoffset / 2;
                var ycord = graph.nodes[i].y * (yoffset) + yoffset / 2;
                ctx.font = '10px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(i, xcord, ycord + 4);
                ctx.font = '10px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.fillText('(' + graph.nodes[i].x + ', ' + graph.nodes[i].y + ')', xcord, ycord + 20);
            }
        }
    }
    
    function drawGraph(graph) {
        for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].weight > 0) {
                var xcord = graph.nodes[i].x * (xoffset) + xoffset / 2;
                var ycord = graph.nodes[i].y * (yoffset) + yoffset / 2;
                ctx.beginPath();
                ctx.arc(xcord, ycord, 10, 0, Math.PI * 2, false);
                ctx.fillStyle = '#000000';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    
    function drawPoints() {
        for (let i = 0; i < points.length; i++) {
            if (points[i].delay > 0)
                continue;
                if (points[i].currstp != points[i].path.length) {
                    if (points[i].x == points[i].toN && points[i].y == points[i].toM) {
                    ctx.beginPath();
                    ctx.arc(points[i].toxc, points[i].toyc, 20, 0, Math.PI * 2, false);
                    ctx.fillStyle = '#006600';
                    ctx.fill();
                    ctx.closePath();
                }
                ctx.beginPath();
                ctx.arc(points[i].xc, points[i].yc, 15, 0, Math.PI * 2, false);
                ctx.fillStyle = points[i].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    
    function animatepoints() {
        points.forEach(point => {
            if (Math.abs(point.toxc - point.xc) >= xVelocity)
                point.toxc > point.xc ? point.xc += xVelocity : point.xc -= xVelocity;
            else
                point.x = point.tox;
            if (Math.abs(point.toyc - point.yc) >= yVelocity)
                point.toyc > point.yc ? point.yc += yVelocity : point.yc -= yVelocity;
            else
                point.y = point.toy;
        });
    }
}

function init() {
    cleanup();
    rows = 15;
    cols = 15;
    BLOCKEDPERCENT = 0;
    graph = createGraph(rows, cols, BLOCKEDPERCENT);
    addPath(4, 4, 4, 12, 5);
    addPath(3, 2, 9, 2);
    addPath(4, 3, 4, 0);
    addPath(4, 10, 4, 0);
    addPath(0, 0, 9, 9);
    addPath(5, 9, 9, 9);
    addPath(14, 4, 4, 14);
    addPath(9, 9, 0, 9);
    document.getElementById('points').hidden = false;
    document.getElementById('points').innerHTML = '';
    document.getElementById('points').appendChild(makeUL(points));
    pathFinding();
}

/**
* Generate random graph with dimensions from 5X5 to 20X20.
* @param {Number} minlen minimal path lenght of points.
* @param {Number} Amount of points.
* @param {Number} Specifies max delay for points.
* @returns {bool} Returns true if operation was successful.
*/
function randomgr(minlen, amount, delay) {
    //cleanup();
    if (minlen < 1 || amount < 1 || delay < 0) {
        return;
    }
    rows = Math.floor(15 * Math.random()) + 5;
    cols = Math.floor(15 * Math.random()) + 5;
    BLOCKEDPERCENT = 0.5 * Math.random();
    graph = createGraph(rows, cols, BLOCKEDPERCENT);
    var cnt = 0;
    while (points.length < amount && cnt < 1000) {
        var b = addPath(Math.floor(cols * Math.random()),
            Math.floor(rows * Math.random()),
            Math.floor(cols * Math.random()),
            Math.floor(rows * Math.random()),
                       delay * Math.random());
        if (b) {
            if (points[points.length - 1].path.length < minlen) {
                points.pop();
            }
        }
        else cnt++;
    }
    document.getElementById('points').hidden = false;
    document.getElementById('points').innerHTML = '';
    document.getElementById('points').appendChild(makeUL(points));
    pathFinding();
    return true;
}

/**
* Add point.
*  @param {Number} fromN Start x coordinate.
*  @param {Number} fromM Start y coordinate.
*  @param {Number} toN Destination x.
*  @param {Number} toM Destination y.
*  @param {Number} delay Delay before starting movement, counts in turns.(See stepSpeed)
*  @returns {bool} Returns true if operation was successful.
*/
function addPath(fromN, fromM, toN, toM, delay) {
    delay = parseInt(delay);
    
    if (!delay || delay < 0) {
        delay = 0;
    }
    if (fromN < rows && fromN >= 0 && fromM < cols && fromM >= 0 && toN < rows && toN >= 0 && toM < cols && toM >= 0) {
        if (graph.grid[fromN][fromM].weight > 0 && graph.grid[toN][toM].weight > 0) {
            let astarpath = astar.search(graph, graph.grid[fromN][fromM], graph.grid[toN][toM]);
            if (astarpath[0]) {
                let clr = getRandomColor();
                points.push(
                    {
                        x: fromN,
                        y: fromM,
                        color: clr,
                        currstp: 0,
                        ended: false,
                        xc: fromN * (xoffset) + xoffset / 2,
                        yc: fromM * (yoffset) + yoffset / 2,
                        toxc: fromN * (xoffset) + xoffset / 2,
                        toyc: fromM * (yoffset) + yoffset / 2,
                        tox: fromN,
                        toy: fromM,
                        lost: 0,
                        con: 0,
                        delay: delay,
                        fromN: fromN,
                        fromM: fromM,
                        toN: toN,
                        toM: toM,
                        path: astarpath,
                    });
                return true;
            }
        }
    }
    return false;
}

// Create random graph
function createGraph(rows, cols, BLOCKEDPERCENT) {
    var imput = [];
    if (BLOCKEDPERCENT >= 0 && BLOCKEDPERCENT < 1 && rows > 0 && cols > 0) {
        xoffset = (canvas.width) / rows;
        yoffset = (canvas.height) / cols;
        yVelocity = Math.ceil(drawSpeed / yoffset);
        xVelocity = Math.ceil(drawSpeed / xoffset);
        for (let i = 0; i < rows; i++) {
            var row = [];
            for (let c = 0; c < cols; c++) {
                row.push((Math.random() > BLOCKEDPERCENT) ? 1 : 0);
                //row.push(1);
            }
            imput.push(row);
        }
        document.getElementById('updatebutton').disabled = false;
        document.getElementById('newpoint').disabled = false;
        document.getElementById('pointdev').hidden = false;
        document.getElementById('options').hidden = false;
        //return new Graph(imput);
        return new Graph(imput, { diagonal: diagonal_state , tor: tor_state});
    }
    return null;
}

// Delete graph, points and clear canvas, Like you just reloaded the page
function cleanup() {
    points = [];
    graph = 0;
    if (drawint)
        clearInterval(drawint);
    if (stepint)
        clearInterval(stepint);
}

// Generate random hex
function getRandomColor() {
    var letters = '123456789ABCDE';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

// List of points
function makeUL(array) {
    var list = document.createElement('ul');
    for (var i = 0; i < array.length; i++) {
        var item = document.createElement('li');
        var idiv = document.createElement('div');
        var p = document.createElement('p');
        idiv.className = 'input-color';
        var cdiv = document.createElement('div');
        cdiv.className = 'color-box';
        cdiv.style = 'background-color: ' + array[i].color + ';'
        p.appendChild(document.createTextNode('(' + array[i].fromN + ', ' + array[i].fromM + ')' +
                                              '→(' + array[i].toN + ', ' + array[i].toM + ') ' +
                                              'Lost = ' + points[i].lost +
                                              ', concur = ' + points[i].con +
                                              ', speed = ' + Math.round(100 * points[i].path.length / (points[i].path.length + points[i].lost)) / 100));
        idiv.appendChild(p);
        idiv.appendChild(cdiv);
        item.appendChild(idiv);
        list.appendChild(item);
    }
    return list;
}

// Keyboard Shortcuts
window.onkeydown = function (e) {
    var code = e.keyCode ? e.keyCode : e.which;
    if (code === 73) {
        init();
    }
    if (code === 80) {
        pause();
    }
    if (code === 83) {
        graph.download();
    }
    if (code === 71) {
        console.log(graph);
    }
    if (code === 82) {
        randomgr(10, 10, 5)
    }
};

// Pause movement
function pause() {
    paused = paused ? !1 : !0
}

// Add and remove nodes
function canvasClick(e) {
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    x = Math.floor(x / xoffset)
    y = Math.floor(y / yoffset)
    graph.grid[x][y].weight = 0 < graph.grid[x][y].weight ? 0 : 1
}

// Load graph from saved state
// TODO: Add loading points.
document.getElementById('import').onclick = function () {
    var files = document.getElementById('selectFiles').files;
    if (files.length <= 0) {
        return false;
    }

    var fr = new FileReader();

    fr.onload = function (e) {
        var imput = [];
        var graphupload = JSON.parse(e.target.result);
        rows = graphupload.length;
        cols = graphupload[0].length;
        xoffset = (canvas.width) / rows;
        yoffset = (canvas.height) / cols;
        yVelocity = Math.ceil(drawSpeed / yoffset);
        xVelocity = Math.ceil(drawSpeed / xoffset);
        for (let i = 0; i < rows; i++) {
            var row = [];
            for (let c = 0; c < cols; c++) {
                row.push(graphupload[i][c])
            }
            imput.push(row);
        }
        document.getElementById('updatebutton').disabled = false;
        document.getElementById('newpoint').disabled = false;
        document.getElementById('pointdev').hidden = false;
        document.getElementById('options').hidden = false;
        graph = new Graph(imput, { diagonal: diagonal_state });
        pathFinding();
    }
    fr.readAsText(files.item(0));
};

//Synchronous checkbox for all tabs
$('#checkb1').click(function () {
    if ($(this).is(':checked')) {
        document.getElementById('checkb2').checked = true;
        document.getElementById('checkb3').checked = true;
        diagonal_state = true;
    }
    else {
        diagonal_state = false;
        document.getElementById('checkb2').checked = false;
        document.getElementById('checkb3').checked = false;
    }
});
$('#checkb2').click(function () {
    if ($(this).is(':checked')) {
        document.getElementById('checkb1').checked = true;
        document.getElementById('checkb3').checked = true;
        diagonal_state = true;
    }
    else {
        diagonal_state = false;
        document.getElementById('checkb1').checked = false;
        document.getElementById('checkb3').checked = false;
    }
});
$('#checkb3').click(function () {
    if ($(this).is(':checked')) {
        document.getElementById('checkb2').checked = true;
        document.getElementById('checkb1').checked = true;
        diagonal_state = true;
    }
    else {
        diagonal_state = false;
        document.getElementById('checkb2').checked = false;
        document.getElementById('checkb1').checked = false;
    }
});
