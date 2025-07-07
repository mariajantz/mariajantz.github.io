//note: run from terminal with: npx serve . since Firefox doesn't allow importing from local for security

//TODO NEXT
//add tooltips!
//Error: add colors disabling - this currently breaks when you manually type in too many colors
//technically it works, it just lets num clrs get set wrong and doesn't do next steps
// ...check in updateGrid, also figure out handling with resizing windows.

//Error: set up the categorical plots with a width based on screenwidth/window width like the images
//or otherwise use document.getElementById('col-'+num_clrs-1).offsetWidth*
//or figure out how to do side by side...two flex boxes?


//LATER MAYBE
//add a plot of fake data for the spectrum option?
//add constrain saturation?
//Add input by a list???
//make export - radio on change not "reset" button? or not, given formatting.

// - add "share palette" link that auto inputs the colors (maybe just add hexes at end of link? or rgb vals)

//THEN (or any time): make pretty. 
//cleaner buttons (image)
//show only the gradient or categorical relevant options (ie eliminate saturation vs eliminate gradient)
//Allow drag and drop of specific colors to reorder
//https://www.w3schools.com/HTML/html5_draganddrop.asp
//https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js
//https://codepen.io/abechiyo/pen/aJdQXm
//
// - add this link: http://poynton.ca/ColorFAQ.html, https://www.kennethmoreland.com/color-maps/ColorMapsExpanded.pdf (got the maps from there)
// - add tooltips

let undoArr = []; //initialize global array 
let lockArr = []; //initialize locked array (also update this when undo/redo)
const cpickArr = {}; //these have to be globally tracked because they're objects (class in code not findable by id in doc)
let undoIdx = -1;
let catVisited = false;

initializePage()

function initializePage() {
    //pull the values from the settings 
    //generate a set of rgb colors matching the settings
    //save those colors to undo array
    //populate those colors
    resetDefaults();

    document.getElementById('undo').onclick = undo;
    document.getElementById('undo').disabled = true; //caching means I have to force this
    document.getElementById('redo').onclick = redo;
    document.getElementById('redo').disabled = true;
    document.getElementById('reset').onclick = resetDefaults;
    document.getElementById('unlock').onclick = unlockAll;
    document.getElementById('generate').onclick = regenColors;
    document.getElementById('regenerate').onclick = regenColors;
    document.getElementById('grad-scheme').onclick = gradDefaults;
    document.getElementById('cat-scheme').onclick = catDefaults;
    document.getElementById('add-color').onclick = addColor;
    document.getElementById('export-reset').onclick = exportVals;
    document.getElementById('min_bright').addEventListener('change', function () { validBright(this); });
    document.getElementById('max_bright').addEventListener('change', function () { validBright(this); });
    document.getElementById('sort').onmouseup = sort;
    document.getElementById('plots-left').onclick = restylePlot;

    populatePlots();
    populatePercept(undoArr[undoIdx]);
    // Plotly.newPlot('percept-plot', makePerceptPlot(), layout, {
    //     responsive: true,
    //     displaylogo: false,
    //     staticPlot: true,
    //     showlegend: false
    // });

}


function populatePlots() {
    var layout = {
        showlegend: false,
        height: 250,
        width: 400,
        margin: {
            l: 20,
            r: 20,
            b: 20,
            t: 20,
            pad: 1
        },
        xaxis: {
            autorange: true,
            showgrid: true,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        yaxis: {
            autorange: true,
            showgrid: true,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        }
    }

    Plotly.newPlot('line-plot', makeData(), layout, {
        responsive: true,
        displaylogo: false,
        staticPlot: true,
        showlegend: false
    });

    Plotly.newPlot('scatter-plot', makeDataScatter(), layout, {
        responsive: true,
        displaylogo: false,
        staticPlot: true,
        showlegend: false
    });
}


function populatePercept(clrs) {
    num_clrs = +document.getElementById('num_clrs').value;

    var layout = {
        showlegend: true,
        height: 250,
        // width: 800,
        margin: {
            l: 0,
            r: 0,
            b: 20,
            t: 20,
            pad: 0
        },
        xaxis: {
            // autorange: true,
            showgrid: false,
            zeroline: true,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false,
            range: [0, num_clrs - 2]
        },
        yaxis: {
            // autorange: true,
            // showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            // ticks: '',
            showticklabels: true,
            range: [0, 100]
        },
        legend: {
            "orientation": "h"
        }
    }

    Plotly.newPlot('percept-plot', makePerceptPlot(clrs), layout, {
        responsive: true,
        displaylogo: false,
        staticPlot: true,
        showlegend: false
    });
}


//deal with example plot
function makeData() {
    //generate random points for the correct number of traces, based on number of input colors 
    const xvals = [1, 2, 3, 4, 5, 6, 7, 8];
    var all_traces = [];
    for (var n = 0; n < undoArr[undoIdx].length; n++) {
        let tmptrace = {
            // name: 'trace ' + (n + 1),
            x: xvals,
            y: Array.from({ length: xvals.length }, () => Math.floor(Math.random() * 10 + n * 2)),
            line: {
                color: rgbArrTorgb(undoArr[undoIdx][n]),
                width: 3
            }
        }
        all_traces.push(tmptrace);
    }

    return all_traces
}

function makePerceptPlot(clrs) {
    //get xvals for the colors I'm using. Y vals are lightness in cielab.
    //clrs input should be spectrum if using gradient and individual colors if using categorical
    //make a list in which each point is duplicated 
    // Array.from(Array(10).keys())
    const xvals = Array.from(Array(clrs.length).keys());

    var lvals = [rgb2lab(clrs[0])[0]];
    var evals = [0];
    var all_traces = [];

    for (var n = 1; n < clrs.length; n++) {
        //get lightness L
        lvals.push(rgb2lab(clrs[n])[0])
        //then get delta E from last one
        evals.push(chroma.deltaE(clrs[n - 1], clrs[n]))
    }
    evals[0] = evals[1];
    evals = evals.map(x => x + median(lvals) - median(evals));


    var eideal = [median(evals), median(evals)]; //fit a dotted line to perfectly flat
    var lideal = [lvals[0], lvals[lvals.length - 1]]; //fit a dotted line to perfectly same slope

    let ltrace = {
        name: 'L*',
        x: xvals,
        y: lvals,
        marker: {
            size: 1
        },
        line: {
            width: 6,
            color: '#bbb'

        }
    }
    all_traces.push(ltrace);

    let litrace = {
        name: 'L* ideal',
        x: [xvals[0], xvals[xvals.length - 1]],
        y: lideal,
        marker: {
            size: 1
        },
        line: {
            dash: 3,
            width: 3,
            color: '#1b1b1b'
        }
    }

    all_traces.push(litrace);

    let etrace = {
        name: 'deltaE',
        x: xvals,
        y: evals,
        marker: {
            size: 1
        },
        line: {
            width: 6,
            color: '#abc7f8'

        }
    }

    all_traces.push(etrace);

    let eitrace = {
        name: 'deltaE ideal',
        x: [xvals[0], xvals[xvals.length - 1]],
        y: eideal,
        marker: {
            size: 1
        },
        line: {
            dash: 3,
            width: 3,
            color: '#435980'
        }
    }

    all_traces.push(eitrace);


    return all_traces;

}

function makeDataScatter() {
    //generate random points for the correct number of scatter categories, based on number of input colors 
    const xvals = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    var all_traces = [];
    for (var n = 0; n < undoArr[undoIdx].length; n++) {
        let noffset = Math.random();
        let tmptrace = {
            // name: 'trace ' + (n + 1),
            x: xvals.map((xv) => xv * n + randNormal() / 1.5 - .5),
            y: Array.from({ length: xvals.length }, () => noffset + randNormal() * 2),
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: rgbArrTorgb(undoArr[undoIdx][n]),
                opacity: .4,
                size: 12
                // width: 3
            }
        }
        all_traces.push(tmptrace);
    }
    return all_traces;
}

function randNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
    return num;
}


function makeSpectrum(clrs) {
    //interpolate the points on the spectrum
    let num_spec = 200;
    var spec_clrs = chroma.scale(clrs).colors(num_spec)// 

    // console.log(spec_clrs)

    var e = document.getElementById("spectrum-target");
    e.style.height = '3em';
    e.style.marginTop = '1em';
    e.style.display = 'flex';
    var crows = document.getElementsByClassName('row-0');

    // var crowwidth = crows[0].offsetWidth * crows.length;
    //TODO figure out actual width to use for these (might need to change number from 200??)
    //make a div for each color space with the same width as the rows above
    // var rows = 6; //TODO do this in not just RGB...maybe swap plots???

    //i like the idea of doing this with stairsteps but it might not be as pretty.
    for (var i = 0; i < num_spec; i++) {
        if (e.childElementCount < num_spec) {
            var newDiv = document.createElement('div');
            newDiv.id = 'spec-' + i;
        } else {
            var newDiv = document.getElementById('spec-' + i);
        }

        // console.log(crowwidth/num_spec); 

        newDiv.style.backgroundColor = spec_clrs[i]; //rgbArrTorgb(randColor()); 
        newDiv.style.flexBasis = '.8em';
        e.appendChild(newDiv);

    }

    //output full rgb colors (so I can send it to calculate lightness)
    return spec_clrs;

}

function recolorImg(imgname, spec_clrs) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "./assets/img/" + imgname + '.png';

    const canvas = document.getElementById(imgname);
    var parent = canvas.parentNode;
    var styles = getComputedStyle(parent);

    // let w = parseInt(styles.getPropertyValue("width"), 10);
    let maxh = parseInt(styles.getPropertyValue("height"), 10);
    let maxw = canvas.parentElement.parentElement.parentElement.offsetWidth;
    let imgratio = img.width / img.height;
    let divFact = 4.5;

    // console.log('max', maxh, maxw/divFact, maxw/divFact/imgratio)
    let h = maxw / divFact / imgratio;

    canvas.style.height = h + 'px';
    canvas.style.width = h * imgratio + 'px';
    canvas.style.paddingLeft = '.5em';
    canvas.style.paddingRight = canvas.style.paddingLeft;
    // console.log(canvas, canvas.parentElement, document.getElementById('export-target').offsetWidth, canvas.parentElement.parentElement.offsetWidth, canvas.parentElement.parentElement.parentElement.offsetWidth)
    const ctx = canvas.getContext("2d");

    // canvas.width = Math.round(canvas.style.width); 
    // canvas.height = Math.round(canvas.style.height); 

    var hRatio = canvas.width / img.width;
    var vRatio = canvas.height / img.height;
    var ratio = Math.min(hRatio, vRatio);

    // console.log(canvas.width, canvas.style.width, canvas.height, canvas.style.height, img.width, img.height, ratio)


    var clrRatio = (spec_clrs.length - 1) / 255;

    img.onload = () => {
        // ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
        convCB(0);
        resizeCanvas();
    };

    const resizeCanvas = () => {
        // console.log('resize')
        maxw = canvas.parentElement.parentElement.parentElement.offsetWidth;
        h = maxw / divFact / imgratio;
        canvas.style.height = h + 'px';
        canvas.style.width = h * imgratio + 'px';

        let expw = document.getElementById('export-target').offsetWidth;
        let emone = parseFloat(getComputedStyle(parent).fontSize);
        let cfullw = (parseFloat(canvas.style.width) + emone) * 3;

        if (expw > cfullw) {
            canvas.style.paddingLeft = (expw - cfullw) / 6 + emone / 2 + 'px';
            canvas.style.paddingRight = canvas.style.paddingLeft;
        } else {
            canvas.style.paddingLeft = '.5em';
            canvas.style.paddingRight = canvas.style.paddingLeft;
        }
    }

    const convCB = (cbtype) => {
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * ratio, img.height * ratio);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            //converting from grayscale img so mapping is easy 
            let rgb = toCB(hexToRgbArr(spec_clrs[Math.floor(data[i] * clrRatio)]), cbtype);
            data[i] = rgb[0]; //red
            data[i + 1] = rgb[1]; //green
            data[i + 2] = rgb[2]; //blue
        }
        ctx.putImageData(imageData, 0, 0);
    };

    const inputs = document.querySelectorAll("[name=radio-cbtype]");
    for (const input of inputs) {
        input.addEventListener("change", (evt) => {
            switch (evt.target.id) {
                case 'deut':
                    return convCB(1);
                case 'prot':
                    return convCB(2);
                case 'trit':
                    return convCB(3);
                case 'gray':
                    return convCB(4);
                default:
                    return convCB(0);
            }
        });
    }

    window.addEventListener("resize", resizeCanvas);
}


function restylePlot() {
    var ele = document.getElementsByClassName('plotcolors');
    // var row0 = document.getElementsByClassName('row-0');
    var graphDiv = document.getElementById('line-plot');
    var scatterDiv = document.getElementById('scatter-plot');
    if (graphDiv.data.length < undoArr[undoIdx].length) {
        populatePlots();
    }
    for (var i = 0; i < ele.length; i++) {
        if (ele[i].checked) {
            //get the new color for each trace and set it
            for (var j = 0; j < graphDiv.data.length; j++) {
                // Choose correct separator
                // let rgb = row0[j + 1].style.backgroundColor;
                // let sep = rgb.indexOf(",") > -1 ? "," : " ";
                // // Turn "rgb(r,g,b)" into [r,g,b]
                // rgb = rgb.substring(4).split(")")[0].split(sep);
                // console.log(undoArr[undoIdx][j], i, toCB(undoArr[undoIdx][j], i))

                if (j >= undoArr[undoIdx].length) {
                    let update = {
                        'visible': false
                    };
                    Plotly.restyle(graphDiv, update, j);

                    let supdate = {
                        'visible': false
                    };
                    Plotly.restyle(scatterDiv, supdate, j);
                } else {
                    let update = {
                        'line.color': rgbArrTorgb(toCB(undoArr[undoIdx][j], i)),
                        'visible': true
                    };
                    Plotly.restyle(graphDiv, update, j);

                    let supdate = {
                        'marker.color': rgbArrTorgb(toCB(undoArr[undoIdx][j], i)),
                        'visible': true
                    };
                    Plotly.restyle(scatterDiv, supdate, j);
                }
            }
        }
    }
}

function resetDefaults() {
    var radios = document.getElementsByClassName('scheme-type');
    //unlock all colors
    unlockAll();

    document.getElementById('export-spec').checked = false; 

    if (radios[0].checked) {
        catDefaults();
    } else {
        gradDefaults();
    }

    var ele = document.getElementsByClassName('plotcolors');
    // reset plotting to rgb
    if (!ele[0].checked) {
        ele[0].checked = true;
        if (catVisited) {
            restylePlot();
        }
    }

}

function catDefaults() {
    document.getElementById('num_clrs').value = 6;
    document.getElementById('min_bright').value = 30;
    document.getElementById('max_bright').value = 80;

    document.getElementById('light-correct-check').style.display = 'none';
    document.getElementById('smooth_grad').style.display = 'none';

    document.getElementById('color-grid').style.justifyContent = 'flex-start'; 

    regenColors();

    catVisited = true;

    //ADD HERE: remove the spectrum?
    //remove pictures and add plots
}

function gradDefaults() {
    document.getElementById('num_clrs').value = 10;
    document.getElementById('min_bright').value = 10;
    document.getElementById('max_bright').value = 90;

    document.getElementById('light-correct-check').style.display = 'inline';
    document.getElementById('smooth_grad').style.display = 'inline';

    document.getElementById('color-grid').style.justifyContent = 'space-between'; 
    // justify - content: space - between in the color - grid div
    //regenerate the array

    regenColors();

    //ADD HERE: add the spectrum

}

function updateUndo() {
    let mem_cutoff = 50; //to do: this breaks
    //get array of colors
    let clrdivs = document.getElementById('color-grid').children;
    let outarr = [];

    for (var i = 0; i < clrdivs.length; i++) {
        let clr = colorValues(clrdivs[i].children[1].style.backgroundColor);
        outarr.push([Math.round(clr[0]), Math.round(clr[1]), Math.round(clr[2])]);
    }

    if (undoArr.length != undoIdx + 1) {
        //deals with undo then do something else 
        undoArr.splice(undoIdx + 1, undoArr.length - undoIdx)
        lockArr.splice(undoIdx + 1, lockArr.length - undoIdx)
        document.getElementById('redo').disabled = true;
    }

    undoArr.push(outarr);

    //also new lock states
    lockArr.push(getLocked());

    //if length of undo array is too long, delete the first one
    if (undoArr.length >= mem_cutoff) {
        undoArr.shift();
        lockArr.shift();
    } else {
        undoIdx++;
    }
    if (undoIdx > 0) {
        document.getElementById('undo').disabled = false;
    }

    // document.getElementById('undosteps').innerHTML = undoIdx; 

    //any time this gets updated, also update the exported values
    exportVals();

    var radios = document.getElementsByClassName('scheme-type');
    if (radios[0].checked && catVisited) {
        restylePlot();
    } else if (radios[0].checked){
        populatePlots();
    } else {
        console.log('edit imgs')
        // console.log('percept')
        let spec_clrs = makeSpectrum(undoArr[undoIdx]); //this must happen after the grid is updated.
        recolorImg('lowfreq', spec_clrs)
        recolorImg('highfreq', spec_clrs)
        recolorImg('ramonycajal', spec_clrs)
        populatePercept(undoArr[undoIdx]);
    }

}

function regenColors() {
    var radios = document.getElementsByClassName('scheme-type');
    var tmp = []; //clr arr and lock vals
    if (radios[0].checked) {
        tmp = regenColorsCat();
    }
    else {
        tmp = regenColorsGrad();
        // makeSpectrum(tmp[0]) //TODO - call this differently - recalc for 200 clrs.
    }

    updateGrid(tmp[0], tmp[1]);

    //update the undoArr, index, locked
    updateUndo();

    checkMinWidth(); 

    // let spec_clrs = makeSpectrum(tmp[0]); //this must happen after the grid is updated.
    //calculate lightness and show
    togglePlots(tmp[0]); 

}

function togglePlots(clrArr) {
    var radios = document.getElementsByClassName('scheme-type');

    if (radios[0].checked) {
        //remove the images and replace with the plots
        document.getElementById('line-plot').style.display = 'inline';
        document.getElementById('scatter-plot').style.display = 'inline';
        document.getElementById('lowfreq').style.display = 'none';
        document.getElementById('highfreq').style.display = 'none';
        document.getElementById('ramonycajal').style.display = 'none';
        document.getElementById('spectrum-target').style.display = 'none';
        document.getElementById('percept-plot').style.display = 'none';

        document.getElementById('spec-lbl').style.display = 'none';
        document.getElementById('percept-lbl').style.display = 'none';
        document.getElementById('spexport').style.display = 'none';

        if (catVisited) {
            restylePlot();
        }
    }

    else {
        // makeSpectrum(tmp[0]) 
        document.getElementById('spectrum-target').style.display = 'flex';
        let spec_clrs = makeSpectrum(clrArr); //this must happen after the grid is updated.

        document.getElementById('line-plot').style.display = 'none';
        document.getElementById('scatter-plot').style.display = 'none';
        document.getElementById('lowfreq').style.display = 'inline';
        document.getElementById('highfreq').style.display = 'inline';
        document.getElementById('ramonycajal').style.display = 'inline';
        document.getElementById('percept-plot').style.display = 'flex';
        document.getElementById('spec-lbl').style.display = 'inline';
        document.getElementById('percept-lbl').style.display = 'inline';
        document.getElementById('spexport').style.display = 'inline';

        recolorImg('lowfreq', spec_clrs)
        recolorImg('highfreq', spec_clrs)
        recolorImg('ramonycajal', spec_clrs)

        populatePercept(undoArr[undoIdx]);
    }
}

function regenColorsGrad() {
    // console.log('gradient generate colors')

    let newLocks = getLocked();
    const locksum = newLocks.reduce((partialSum, a) => partialSum + a, 0);
    let clrArr = [];
    var outLocks = Array(+document.getElementById('num_clrs').value).fill(0);

    if (locksum <= 2) {
        clrArr = interpVals();

        // newLocks.fill(0); //set all to zeros
        //now update the relevant locking! 
        if (locksum >= 1) {
            outLocks[0] = 1; //first one is going to be on the left
        }
        if (locksum == 2) {
            outLocks[outLocks.length - 1] = 1; //second on the right
        }

    } else {
        //MULTI-HUE WITH STEP CORRECTION
        //this is in line with: https://www.vis4.net/blog/2013/09/mastering-multi-hued-color-scales/
        let tmp = interpMulti(); //UPDATE THIS -- deal with >20 case. 
        clrArr = tmp[0];

        // newLocks.fill(0); //set all to zeros
        for (var i = 0; i < tmp[1].length; i++) {
            outLocks[tmp[1][i]] = 1;
        }
    }

    return [clrArr, outLocks];

    //TO DO!! add a spectrum beneath w/ 200 colors

}

function regenColorsCat() {
    //reset the whole array minus any locked
    //identify the locked values, pass those as locked and regenerate the rest
    let num_clrs = +document.getElementById('num_clrs').value;

    let genArr = genCandidates(indexByBool(undoArr[undoIdx], getLocked()).map(rgb2lab), num_clrs);

    let newLocks = getLocked();
    
    //This makes funky stuff happening with the lock but...
    //reindex based on the original array of undoIdx
    let clrArr = [];
    const locksum = newLocks.reduce((partialSum, a) => partialSum + a, 0);
    var lockct = 0;
    var unlockct = 0;

    //now update the locks! this is necessary in case going from larger to smaller num of colors
    var outLocks = Array(num_clrs).fill(0);
    if (locksum > num_clrs) {
        //if there are more locked than the new number of colors keep all
        outLocks = Array(locksum).fill(1);
    }

    if (outLocks.length < newLocks.length) {
        //get the indices of currently locked colors
        let idxLock = getBoolIdx(newLocks).reverse();
        let maxVal = num_clrs;
        // let scootVal = maxVal; 
        for (var i = 0; i <= idxLock.length; i++) {
            //choose the colors that are larger than the num clrs
            //any of the colors that are larger should get decremented
            // console.log(idxLock)
            if (idxLock[i] >= maxVal) {
                maxVal--;
                idxLock[i] = maxVal;
            }
        }

        for (var i = 0; i < idxLock.length; i++) {
            outLocks[idxLock[i]] = 1;
        }
        newLocks = outLocks;

    } else {
        outLocks = newLocks; 
    }


    for (var i = 0; i < genArr.length; i++) {
        //add to the array depending if locked or not
        if (newLocks[i] == 1) {
            //add from locked (beginning of array)
            clrArr.push(genArr[lockct]);
            lockct++;
        } else {
            //add from unlocked (mid of array)
            clrArr.push(genArr[locksum + unlockct]);
            unlockct++;
        }
    }


    return [clrArr, outLocks];

    //update the undoArr, index, locked
    // updateUndo(); 

    //do the plotting update
}

function indexByBool(arr, boolIdx) {
    var res = [];
    for (var i = 0; i < boolIdx.length; i++) {
        if (boolIdx[i] == 1) {
            res.push(arr[i]);
        }
    }
    return res;
}

function getBoolIdx(boolIdx) {
    var res = [];
    for (var i = 0; i < boolIdx.length; i++) {
        if (boolIdx[i] == 1) {
            res.push(i);
        }
    }
    return res;
}

function sort() {
    //wrapper function for each kind of sort
    let sortcat = document.getElementById('sort').selectedOptions[0].value;
    let sortorder = [];

    if (sortcat == 'none') {
        sortorder = sortDist();
        // console.log(sortorder); 

    } else if (sortcat == 'value') {
        sortorder = sortValue();

    } else if (sortcat == 'hue') {
        sortorder = sortHue();

    } else if (sortcat == 'random') {
        sortorder = [...Array(undoArr[undoIdx].length).keys()];
        shuffle(sortorder);
    } else if (sortcat == 'reverse') {
        sortorder = [...Array(undoArr[undoIdx].length).keys()];
        sortorder.reverse();
    }
    var reordered = sortorder.map(
        index => undoArr[undoIdx][index]);
    var reorderedLocks = sortorder.map(
        index => lockArr[undoIdx][index]);

    updateGrid(reordered, reorderedLocks);

    updateUndo();

    if (document.getElementById('spectrum-target').style.display != 'none') {
        makeSpectrum(undoArr[undoIdx])
    }

}

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function sortValue() {
    //tmp function - will need to make a different sorting option for each of these!
    //color distance, hue, value
    //go through and rearrange the order in undoArr, undoIdx, do basically like regenColors method
    let vals = [];
    for (var i = 0; i < undoArr[undoIdx].length; i++) {
        let tmp = rgb2lab(undoArr[undoIdx][i]);
        vals.push(tmp[0]); //array of lightnesses
    }

    return sortIdx(vals).sortIndices;
}

function sortHue() {
    //tmp function - will need to make a different sorting option for each of these!
    //color distance, hue, value
    //go through and rearrange the order in undoArr, undoIdx, do basically like regenColors method
    let vals = [];
    for (var i = 0; i < undoArr[undoIdx].length; i++) {
        let tmp = rgbToHsl(rgbArrTorgb(undoArr[undoIdx][i]));
        vals.push(tmp[0]); //array of lightnesses
    }

    return sortIdx(vals).sortIndices;
}

function sortDist() {
    let clrLab = undoArr[undoIdx].map(rgb2lab);
    let dists = calcDist(clrLab, clrLab);

    //by median of the mins, choose the first value.
    var med_dists = [];
    for (var i = 0; i < dists.length; i++) {
        med_dists.push(median(dists[i]));
    }

    var sorted_dists = sortIdx(med_dists);
    var outIdx = [sorted_dists.sortIndices.reverse()[0]];
    var outLab = [clrLab[outIdx]];

    //for the remaining indices...
    //calculate distance from the values added to the array
    for (var i = 1; i < clrLab.length; i++) {
        dists = calcDist(clrLab, outLab);
        //calculate highest minimum value! (farthest from other colors)
        let minlst = [];
        for (var j = 0; j < dists.length; j++) {
            minlst.push(Math.min(...dists[j]));
        }
        //get the highest min
        let maxval = Math.max(...minlst);
        outIdx.push(minlst.indexOf(maxval));
        outLab.push(clrLab[minlst.indexOf(maxval)]);
    }


    return outIdx;

}

function updateGrid(clrArr, lockedArr) {
    let e = document.getElementById('color-grid');
    let ech = e.children;
    // let curLocked = getLocked(); //actually this may not work bc this is also used for undo; maybe pass in

    for (var i = 0; i < clrArr.length; i++) {
        //cycle through colors and update them; deal with deleted vals
        // let colid = 'col-' + i.toString();
        let colid = -1;
        let elem = -1;
        if (i < ech.length) {
            //if i is less than the number of colors already populated
            colid = ech[i].id;
            elem = ech[i];
        } else {
            //get next unused column number
            colid = 'col-' + getColId().toString();
            elem = document.getElementById(colid);
        }
        // fill in or add a color if necessary
        // console.log(i, clrArr[i], colid)
        if (elem) {
            //if column with that id exists, make this.
            resetCol(clrArr[i], colid);
        }
        else {
            //add a color
            populateColor(...clrArr[i])
            document.getElementById('num_clrs').value++;
            //pass out elem in case locking is needed!
            elem = e.children[i]; //define this so I can pass to locking
            // console.log('hi', elem)
            // console.log(lockedArr[i], elem.children[0].children[0].classList.contains('locked'))
        }

        //set the color as locked/unlocked
        let lockdiv = document.getElementsByClassName(elem.id)[1].children;
        let lockbutt = [];
        for (var j = 0; j < lockdiv.length; j++) {
            if (lockdiv[j].classList.contains('lock')) {
                lockbutt = lockdiv[j];
                break;
            }
        }

        if (lockedArr[i] == 0 && lockbutt.classList.contains('locked')) {
            lockToggle(lockbutt)
        } else if (lockedArr[i] == 1 && !lockbutt.classList.contains('locked')) {
            lockToggle(lockbutt)
        }

    }

    //remove added colors
    if (clrArr.length < ech.length) {
        // console.log('delete extra columns')
        for (var i = ech.length; i-- > clrArr.length;) {
            delete cpickArr['cpick-' + ech[i].id];
            ech[i].remove();
        }
    }

    document.getElementById('num_clrs').value = clrArr.length;
}

function undo() {
    //step back in undo Array
    undoIdx--;

    updateGrid(undoArr[undoIdx], lockArr[undoIdx]);

    document.getElementById('redo').disabled = false;
    if (undoIdx == 0) {
        document.getElementById('undo').disabled = true;
    }
    // document.getElementById('undosteps').innerHTML = undoIdx;
    console.log('Need to track whether each is gradient or categorical for plot type backtracking')
    
    togglePlots(undoArr[undoIdx])
}

function redo() {
    undoIdx++;
    //step forward in undo Array
    updateGrid(undoArr[undoIdx], lockArr[undoIdx]);

    document.getElementById('undo').disabled = false;
    //if at the end of the array, disable
    if (undoIdx == undoArr.length - 1) {
        document.getElementById('redo').disabled = true;
    }
    // document.getElementById('undosteps').innerHTML = undoIdx;

    togglePlots(undoArr[undoIdx])
}


function exportVals() {
    var radios = document.getElementsByClassName('export-select');

    var rchoose = 0;
    for (var r = 0; r < radios.length; r++) {
        if (radios[r].checked) {
            rchoose = radios[r].id
            break;
        }
    }
    // console.log(rchoose);

    // console.log(document.getElementById('format-text').value)
    var strFormat = document.getElementById('format-text').value.toString();
    var regex = /x/gi, result, indices = [];
    while ((result = regex.exec(strFormat))) {
        indices.push(result.index);
    }
    if ((rchoose == 'rgb255' || rchoose == 'rgb1' || rchoose == 'hue') && indices.length != 3) {
        strFormat = '[x, x, x]';
        indices = [];
        while ((result = regex.exec(strFormat))) {
            indices.push(result.index);
        }
    } else if ((rchoose == 'hex') && indices.length != 1) {
        strFormat = 'x';
        indices = [];
        while ((result = regex.exec(strFormat))) {
            indices.push(result.index);
        }
    } else if ((rchoose == 'cmyk') && indices.length != 4) {
        strFormat = '(x, x, x, x)';
        indices = [];
        while ((result = regex.exec(strFormat))) {
            indices.push(result.index);
        }
    }
    // console.log(indices)
    // //depending which radio button is selected, cycle through the colors and get their values in that format
    // var row0 = document.getElementsByClassName('row-0'); 
    let clrArr = []; 

    if (document.getElementById('export-spec').checked) {
        let num_spec = 200;
        clrArr = chroma.scale(undoArr[undoIdx]).colors(num_spec).map(hexToRgbArr);

    } else {
        clrArr = undoArr[undoIdx];
    }

    var clst = [];
    for (var c = 0; c < clrArr.length; c++) {
        if (rchoose == 'rgb255') {
            let res = strFormat.replace(/x/i, clrArr[c][0]);
            res = res.replace(/x/i, clrArr[c][1]);
            res = res.replace(/x/i, clrArr[c][2]);
            clst.push(' ' + res);
        } else if (rchoose == 'rgb1') {
            let res = strFormat.replace(/x/i, (clrArr[c][0] / 255).toFixed(4));
            res = res.replace(/x/i, (clrArr[c][1] / 255).toFixed(4));
            res = res.replace(/x/i, (clrArr[c][2] / 255).toFixed(4));
            clst.push(' ' + res);
        } else if (rchoose == 'cmyk') {
            let tmp = rgbToCmyk(clrArr[c]);
            let res = strFormat.replace(/x/i, tmp[0]);
            res = res.replace(/x/i, tmp[1]);
            res = res.replace(/x/i, tmp[2]);
            res = res.replace(/x/i, tmp[3]);
            clst.push(' ' + res);

        } else if (rchoose == 'hex') {
            let res = strFormat.replace(/x/i, rgbArrToHex(clrArr[c]));
            clst.push(' ' + res);
        } else if (rchoose == 'hue') {
            let tmp = rgbToHsl(rgbArrTorgb(clrArr[c]));
            let res = strFormat.replace(/x/i, tmp[0]);
            res = res.replace(/x/i, tmp[1]);
            res = res.replace(/x/i, tmp[2]);
            clst.push(' ' + res);
        }
    }

    //TODO format: then print them to the screen in the designated column
    var output = document.getElementById('export-target')
    output.innerHTML = clst;
}


function refreshColor(elem) {
    let colid = elem.parentNode.parentNode.id;
    // console.log(colid.parentNode.children);  
    //get the current colors 
    let curClrs = structuredClone(undoArr.slice(-1)[0]) //DEEP COPY of array so undoArr remains unchanged

    //remove the one we're refreshing
    let delClr = colorValues(document.getElementsByClassName('grid-cell row-1 ' + colid)[0].style.backgroundColor);
    var index = -1;
    for (var i = 0; i < curClrs.length; i++) {
        if (delClr[0] == curClrs[i][0] && delClr[1] == curClrs[i][1] && delClr[2] == curClrs[i][2]) {
            index = i;
            break;
        }
    }

    if (index !== -1) {
        curClrs.splice(index, 1);
    }

    let genClrs = genCandidates(curClrs.map(rgb2lab), curClrs.length + 1).reverse();

    resetCol([genClrs[0][0], genClrs[0][1], genClrs[0][2]], colid)

}

function resetCol(rgb, colid) {
    //convenience fn to update a whole column
    var rows = 6;
    for (var row = 1; row < rows; row++) {
        let gridcell = document.getElementsByClassName('grid-cell row-' + row + ' ' + colid)[0];
        let convArr = toCB(rgb, row - 1);
        gridcell.style.backgroundColor = "rgb(" + convArr[0] + "," + convArr[1] + "," + convArr[2] + ")";
    }

    //update the color of the dropper
    var picker = cpickArr['cpick-' + colid];
    picker.setColor("rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")");

}

function addColor() {
    //run for adding a single new color
    //get the current colors 
    let curClrs = structuredClone(undoArr.slice(-1)[0]) //DEEP COPY of array so undoArr remains unchanged

    let genClrs = genCandidates(curClrs.map(rgb2lab), curClrs.length + 1).reverse();

    //make new column
    populateColor(...genClrs[0])

    document.getElementById('num_clrs').value++;

    updateUndo();

}

function genCandidates(locked_cands, num_clrs) {
    var cands = []; //list of candidates

    let minL = +document.getElementById('min_bright').value;
    let maxL = +document.getElementById('max_bright').value;

    let num_cands = 20; //will generate 20x number of colors as candidates

    //make the grid
    //number of l bins
    let num_l = Math.ceil((maxL - minL) / 5);
    //number of a and b bins
    let num_ab = Math.ceil(Math.sqrt(num_clrs * num_cands / num_l));

    //make this a grid and pull a random one from each grid section
    for (var l_bin = 0; l_bin < num_l; l_bin++) {
        for (var a_bin = 0; a_bin < num_ab; a_bin++) {
            for (var b_bin = 0; b_bin < num_ab; b_bin++) {
                //L range is then ...
                let lbinmin = minL + (maxL - minL) / num_l * l_bin;
                //same for the others
                let abinmin = 254 / num_ab * a_bin - 127;
                let bbinmin = 254 / num_ab * b_bin - 127;

                //random draw FROM THIS RANGE
                let l = Math.floor(Math.random() * ((maxL - minL) / num_l)) + lbinmin;
                let a = Math.floor(Math.random() * (254 / num_ab)) + abinmin;
                let b = Math.floor(Math.random() * (254 / num_ab)) + bbinmin;

                cands.push([l, a, b]);
            }
        }
    }

    return sortCandidates(cands, locked_cands, num_clrs);

}

function sortCandidates(cands, locked_cands, num_clrs) {
    //INPUTS MUST BE IN CIELAB FORMAT
    // console.log(locked_cands.map(lab2rgb))
    //get distances to sort the candidates
    // let num_clrs = +document.getElementById('num_clrs').value;
    // let min_dist = +document.getElementById('min_dist').value;

    var dists = calcDist(cands, cands);
    var med_dists = [];
    for (var i = 0; i < dists.length; i++) {
        med_dists.push(median(dists[i]));
    }

    var sorted_dists = sortIdx(med_dists)

    // console.log(sorted_dists.sortIndices)
    //sorts with the ones that are most different at the beginning of the array (due to reverse)
    var max_cands = sorted_dists.sortIndices.map(
        index => cands[index]).reverse();

    //first eliminate the most similar candidates to each of these. //update: don't do this it doesn't help
    // var max_cands = rmCloseNeighbors(sort_cands); 

    //SO at this point, max_cands is sorted and has removed the closest colors in full color vision
    //HOWEVER - because it's been exclusively in CIELAB the conversion can cause problems
    //also it hasn't accounted for deuteranopia
    //so: convert these to RGB, convert to deuter, and then convert back to CIELAB and use those values
    //to sort by highest minimum
    var max_rgb = max_cands.map(lab2rgb);
    var max_deuter = max_rgb.map(function (x) { return toCB(x, 1); });
    var max_deuterlab = max_deuter.map(rgb2lab);

    //by default, this is likely to result in "clumping" - similar colors have similar medians
    //so add one by one to the array and then remove the other candidates that are most similar
    //TODO: here is where you input the change to deal with STARTING with some colors (if locked): 
    if (locked_cands.length == 0) {
        var out_cands = [max_cands[0]]; //initialize output array with the most different one
        var out_deuterlab = [max_deuterlab[0]]; //initialize output array with the most different one
    } else {
        var out_cands = locked_cands;
        var locked_rgb = locked_cands.map(lab2rgb);
        var locked_deuter = locked_rgb.map(function (x) { return toCB(x, 1); });
        var out_deuterlab = locked_deuter.map(rgb2lab);
    }

    //calculate distance from the values added to the array
    //BUT force the locked ones to be maintained.
    for (var i = out_cands.length; i < num_clrs; i++) {
        // console.log(out_cands.map(lab2rgb))
        // dists = calcDist(max_cands, out_cands);
        dists = calcDist(max_deuterlab, out_deuterlab);
        //calculate highest minimum value! (farthest from other colors)
        let minlst = [];
        for (var j = 0; j < dists.length; j++) {
            minlst.push(Math.min(...dists[j]));
        }
        //get the highest min
        let maxval = Math.max(...minlst);

        out_cands.push(max_cands[minlst.indexOf(maxval)])
        out_deuterlab.push(max_deuterlab[minlst.indexOf(maxval)])
    }

    return out_cands.map(lab2rgb);
}

function randColor() {
    // for now just random color
    let r = Math.floor(Math.random() * 255)
    let g = Math.floor(Math.random() * 255)
    let b = Math.floor(Math.random() * 255)
    //return 'rgb(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ')'
    //check brightness (in LAB space)
    let minL = +document.getElementById('min_bright').value;
    let maxL = +document.getElementById('max_bright').value;
    let labclr = rgb2lab([r, g, b]);

    let cutoff = 1.5;
    let tmp = Math.max(r, g, b) / Math.min(r, g, b);
    if (tmp < cutoff) { //try some numbers up to about 1.8
        labclr[0] = minL - 1;
    }

    while (minL > labclr[0] || maxL < labclr[0]) {
        r = Math.floor(Math.random() * 255)
        g = Math.floor(Math.random() * 255)
        b = Math.floor(Math.random() * 255)
        //check brightness (in LAB space)
        labclr = rgb2lab([r, g, b])
        //clear out if too gray
        tmp = Math.max(r, g, b) / Math.min(r, g, b);
        if (tmp < cutoff) { //try some numbers up to about 1.8
            labclr[0] = minL - 1;
        }
    }
    return [r, g, b];
}

function interpVals() {
    //TODO deal with locking??
    //GRADIENT PROCESSING
    //get random colors for 2 ends of spectrum 
    //interpolate between them
    //locked colors
    var st_clrs = [];
    var lockedVals = getLocked();
    for (var i = 0; i < lockedVals.length; i++) {
        if (lockedVals[i] == 1) {
            st_clrs.push(undoArr[undoIdx][i]);
        }
    }

    while (st_clrs.length < 2) {
        //fill remainder w random color
        let tmp = randColor();

        if (st_clrs.length == 0) {
            st_clrs.push(tmp);
        }
        else {
            let dists = calcDist(st_clrs, [tmp]);
            // console.log(dists); 
            if (dists[0] > 40) {
                st_clrs.push(tmp);
            }
        }
        //force that random color to be a minimum distance from the starting color
    }

    let num_clrs = +document.getElementById('num_clrs').value;

    //now there should be two colors to have as ends of spectrum; convert to lab and generate mid points
    let lab_clrs = st_clrs.map(rgb2lab);

    var newL = interpolateArray([lab_clrs[0][0], lab_clrs[1][0]], num_clrs);
    var newa = interpolateArray([lab_clrs[0][1], lab_clrs[1][1]], num_clrs);
    var newb = interpolateArray([lab_clrs[0][2], lab_clrs[1][2]], num_clrs);

    var new_clrs = newL.map(function (e, i) {
        return lab2rgb([e, newa[i], newb[i]]);
    });

    return new_clrs;
}

function interpolateArray(data, fitCount) {

    var linearInterpolate = function (before, after, atPoint) {
        return before + (after - before) * atPoint;
    };

    var newData = new Array();
    var springFactor = new Number((data.length - 1) / (fitCount - 1));
    newData[0] = data[0]; // for new allocation
    for (var i = 1; i < fitCount - 1; i++) {
        var tmp = i * springFactor;
        var before = new Number(Math.floor(tmp)).toFixed();
        var after = new Number(Math.ceil(tmp)).toFixed();
        var atPoint = tmp - before;
        newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
};


function interpMulti() {
    //TODO deal with locking??
    //GRADIENT PROCESSING
    //this one assumes at least 3 values are checked. Therefore, it will do the following: 
    //Remember the checked colors
    //Do a Bezier interpolation between them in each dimension to smooth the curves
    //Do a lightness correction
    //average the Bezier and lightness correction
    //then figure out which colors are closest to original locked colors and check those boxes
    let num_clrs = +document.getElementById('num_clrs').value;
    var st_clrs = indexByBool(undoArr[undoIdx], getLocked());

    //bezier interpolated colors
    var interp_clrs = chroma.bezier(st_clrs).scale().colors(num_clrs);
    //linearly interpolated colors
    var light_clrs = chroma.scale(st_clrs).colors(num_clrs)// 

    //average these two together to end up less grayish - do not bother with lightness correction unless checked
    var new_clrs = [];
    let smoothval = +document.getElementById('smoothing').value;
    for (var i = 0; i < num_clrs; i++) {
        new_clrs.push(chroma.average([light_clrs[i], interp_clrs[i]], 'rgb', [(100 - smoothval) / 100, smoothval / 100]));
    }
    if (document.getElementById('lightcorrect').checked) {
        //update lightness -- I don't like how chroma does it so I convert to lab, get minimum and maximum end, and scale in between
        new_clrs = correctLight(new_clrs);
    }

    //get nearest value to each original color
    var near_idx = [];
    for (var i = 0; i < st_clrs.length; i++) {
        //get distance to each of the colors
        let distTmp = [];
        for (var j = 0; j < new_clrs.length; j++) {
            distTmp.push(chroma.deltaE(st_clrs[i], new_clrs[j]))
        }
        //make minimum distance part of near idx to be checked
        near_idx.push(distTmp.indexOf(Math.min(...distTmp)))
    }

    return [new_clrs.map(hexToRgbArr), near_idx];

    //calculate the nearest values to the starting colors and check those boxes

}

function correctLight(hexClrArr) {
    //convert hex to lab
    let labClr = []
    for (var i = 0; i < hexClrArr.length; i++) {
        labClr.push(rgb2lab(hexToRgbArr(hexClrArr[i])));
    }
    //interpolate L values between beginning and end of array
    let newL = interpolateArray([labClr[0][0], labClr[labClr.length - 1][0]], hexClrArr.length);

    var newArr = [];
    for (var i = 0; i < hexClrArr.length; i++) {
        let tmpClr = lab2rgb([newL[i], labClr[i][1], labClr[i][2]]);

        // console.log([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]);
        // console.log(rgbArrToHex([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]))
        newArr.push(rgbArrToHex([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]))
    }
    // console.log(newArr)

    return newArr
}


function indexOfMax(arr) {
    // console.log('hello')
    // console.log(arr)
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
            // console.log(max)
        }
    }

    return maxIndex;
}

function validBright(elem) {
    // console.log('bright')
    let minL = document.getElementById('min_bright').value;
    let maxL = document.getElementById('max_bright').value;
    let mingap = 5;

    //also reset if out of range, which is allowed manually but not clicking
    if (minL > 100 - mingap) {
        document.getElementById('min_bright').value = 100 - mingap;
    }
    if (maxL > 100) {
        document.getElementById('max_bright').value = 100;
    }
    if (minL < 0) {
        document.getElementById('min_bright').value = 0;
    }
    if (maxL < mingap) {
        document.getElementById('max_bright').value = mingap;
    }

    if (minL >= (maxL - mingap)) {
        //if the calling element is max, then change min; if the calling element is min, then change max
        //require at least 10 between them
        let e = document.getElementById(elem.id)

        if (elem.id.includes('max')) {
            document.getElementById('min_bright').value = +e.value - mingap;
        } else if (elem.id.includes('min')) {
            document.getElementById('max_bright').value = +e.value + mingap;
        }
    }
}

function getColId() {
    var e = document.getElementById("color-grid");
    //get number of children so you know what column number you're on
    // let num = e.childElementCount - 1;
    //cycle over the child elements until you find an unused number 
    // (number just has to be unique)
    let numArr = [];

    for (var i = 0; i < e.children.length; i++) {
        numArr.push(+e.children[i].id.split('col-')[1]);
    }
    numArr.sort(function (a, b) {
        return a - b;
    });
    let num = -1
    for (var i = 0; i < numArr.length; i++) {
        if (numArr[i] != i) {
            //skipped value
            num = i;
            break;
        }
    }
    if (num == -1) {
        num = numArr.length;
    }
    return num;
}

function lockToggle(elem) {
    if (elem.classList.contains('locked')) {
        elem.classList.remove('locked');
    } else {
        elem.classList.add('locked');
    }
}

function getLocked() {
    var locks = document.getElementsByClassName('lock');
    var empty = [];
    for (var i = 0; i < locks.length; i++) {
        if (locks[i].classList.contains('locked')) {
            empty.push(1);
        } else {
            empty.push(0);
        }
    }

    return empty;
}

function unlockAll() {
    var locks = document.getElementsByClassName('lock');

    for (var i = 0; i < locks.length; i++) {
        if (locks[i].classList.contains('locked')) {
            locks[i].classList.remove('locked');
        }
    }
}

function checkMinWidth() {
    var e = document.getElementById("color-grid");
    let countCol = document.getElementsByClassName('row-2');

    if (countCol.length > 3) {

        let min_width = 60; //px. //use known button size to set min width
        let max_cols = e.offsetWidth / min_width;
        if (max_cols < countCol.length) {
            // console.log('STOP')
            document.getElementById('add-color').disabled = true;
        } else {
            document.getElementById('add-color').disabled = false;
        }
        // console.log(parseFloat(getComputedStyle(e).fontSize) * 2);
        // console.log('min', min_width, max_cols)
        // console.log(e.offsetWidth, e.offsetLeft)
    }
}

function populateColor(r, g, b) {
    var e = document.getElementById("color-grid");

    checkMinWidth();

    if (document.getElementById('add-color').disabled) {
        document.getElementById('num_clrs').value = document.getElementsByClassName('row-0').length;
        return;
    }

    //get number of children so you know what column number you're on
    // let num = e.childElementCount - 1;
    //cycle over the child elements until you find an unused number 
    // (number just has to be unique)
    let num = getColId();
    var col = document.createElement('div');
    col.draggable = true;
    col.id = "col-" + num.toString(); //TODO may need different unique identifier here to accomodate moving columns 
    e.appendChild(col);
    var rows = 6;
    // const row_lbls = ['Full color', 'Deuteranopia', 'Protanopia', 'Tritanopia'];
    //make buttons at top
    var cell = document.createElement('div');
    //name each cell so normal, extras get 
    cell.className = "grid-cell row-0 col-" + num.toString();

    // var butt = document.createElement('button');
    // butt.innerHTML = '&#x1F512'; //lock color
    // butt.className = 'lock';
    // butt.addEventListener('click', function () {
    //     lockToggle(this); 
    //     //update the global list of locked values (replace the last one)
    //     //only save locked setup for the last version of each? 
    //     lockArr.splice(lockArr[undoIdx], 1, getLocked());
    // }); 
    // //todo add button action for all of these
    // cell.appendChild(butt);

    var buttz = document.createElement('button');
    // buttz.innerHTML = '&#x1F503'; //refresh this color only
    buttz.classList.add('refresh')
    buttz.classList.add('btn')
    buttz.addEventListener('click', function () {
        refreshColor(this);
        updateUndo();
    });
    cell.style.alignSelf = "center";

    cell.appendChild(buttz);

    cell.style.flexBasis = '2em';
    col.appendChild(cell);

    for (var row = 1; row < rows; row++) {
        var cell = document.createElement('div');
        //name each cell so normal, extras get 
        cell.className = "grid-cell row-" + row.toString() + " col-" + num.toString();


        if (row == 1) {
            cell.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
            // cell.style.flexBasis = '4em';
            cell.classList.add('tall');

            var butt = document.createElement('button');
            // butt.innerHTML = '&#x1F512'; //lock color
            butt.className = 'lock';
            butt.classList.add('btn')
            butt.addEventListener('click', function () {
                lockToggle(this);
                //update the global list of locked values (replace the last one)
                //only save locked setup for the last version of each? 
                lockArr.splice(lockArr[undoIdx], 1, getLocked());
            });

            cell.appendChild(butt);

            var cpick = document.createElement('button');
            cpick.id = 'cpick-target' + col.id;
            // cpick.innerHTML = 'c';
            cell.appendChild(cpick)
        }
        else {
            let convArr = toCB([r, g, b], row - 1);
            cell.style.backgroundColor = "rgb(" + convArr[0] + "," + convArr[1] + "," + convArr[2] + ")";
            // cell.style.flexBasis = '2em';
            cell.classList.add('short');
        }
        col.appendChild(cell);
    }

    //move trash can
    cell = document.createElement('div');
    var buttzz = document.createElement('button');
    // buttzz.innerHTML = '&#x1F5D1'; //delete color
    buttzz.classList.add('trash')
    buttzz.classList.add('btn')
    // buttzz.id = 'delete-'+col.id;
    // buttzz.onclick = deleteColor;
    buttzz.addEventListener('click', function () {
        var savelock = getLocked(); //this is mostly to make sure last col is checked!
        this.parentNode.parentNode.remove();
        document.getElementById('num_clrs').value--;
        delete cpickArr['cpick-' + col.id]
        lockArr[undoIdx] = savelock; //re-up this.
        updateUndo();
        checkMinWidth();
    });

    cell.style.alignSelf = "center";

    cell.appendChild(buttzz);

    col.appendChild(cell);

    //style table
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    col.style.flexBasis = '6em';
    // col.style.width = '3em'
    col.style.gap = '3px';

    let rgb = rgbToHex(document.getElementsByClassName('grid-cell row-1 ' + col.id)[0].style.backgroundColor);
    // let color = rgbToHex(rgb.style.backgroundColor);
    const cpicker = new Alwan('#cpick-target' + col.id, {
        id: 'cpick-' + col.id,
        color: rgb,
        // preset: false, //manually style the button if false
        position: 'top-center',
        opacity: false,
        margin: 0,
        float: 'right',
        singleInput: false
    });

    cpicker.on("color", (color) => {
        // gridcell.style.backgroundColor = color.rgb;
        for (var row = 1; row < rows; row++) {

            let gridcell = document.getElementsByClassName('grid-cell row-' + row + ' ' + col.id)[0];
            let rgba = colorValues(color.rgb);
            let convArr = toCB([rgba[0], rgba[1], rgba[2]], row - 1);
            gridcell.style.backgroundColor = "rgb(" + convArr[0] + "," + convArr[1] + "," + convArr[2] + ")";
        }
    });

    cpicker.on('close',
        () => { updateUndo() }
    )

    cpickArr['cpick-' + col.id] = cpicker;

    //move the button over
    document.getElementById('cpick-target' + col.id).style.float = 'right';

    //check if the add button needs to be disabled
    checkMinWidth();

}



//COLOR CONVERSION AND PROCESSING
function calcDist(clrArr1, clrArr2) {
    //distance between any two color arrays in CIELAB format

    var cdist = []

    for (var i = 0; i < clrArr1.length; i++) {
        cdist.push([]);
        //todo this is non symmetrical why
        for (var j = 0; j < clrArr2.length; j++) {
            cdist[i].push(Math.min(deltaE(clrArr1[i], clrArr2[j]), deltaE(clrArr2[j], clrArr1[i])));
        }
    }
    return cdist
}

function sortIdx(toSort) {
    for (var i = 0; i < toSort.length; i++) {
        toSort[i] = [toSort[i], i];
    }
    toSort.sort(function (left, right) {
        return left[0] < right[0] ? -1 : 1;
    });
    toSort.sortIndices = [];
    for (var j = 0; j < toSort.length; j++) {
        toSort.sortIndices.push(toSort[j][1]);
        toSort[j] = toSort[j][0];
    }
    return toSort;
}



function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}


function toCB(rgbArr, cbType) {
    //where colorblindness type is 0 (normal), 1 (deut), 2 (prot), 3 (trit), 4 (gray)
    //colorblind matrices (Machado et al 2009)
    let deut = [[0.367322, 0.280085, -0.01182], [0.860646, 0.672501, 0.04294], [-0.227968, 0.047413, 0.968881]]; //most common - green blind
    let prot = [[0.152286, 0.114503, -0.003882], [1.052583, 0.786281, -0.048116], [-0.204868, 0.099216, 1.051998]]; //next most common - red blind
    let trit = [[1.255528, -0.078411, 0.004733], [-0.076749, 0.930809, 0.691367], [-0.178779, 0.147602, 0.3039]]; //least common - blue blind
    //matrix multiplication

    //right now assume no translation, just return value
    if (cbType == 0) {
        return rgbArr;
    } else if (cbType == 1) {
        //console.log('convert to deut');
        let outval = mjdot(rgbArr, deut);
        return [Math.round(Math.max(0, Math.min(255, outval[0]))),
        Math.round(Math.max(0, Math.min(255, outval[1]))),
        Math.round(Math.max(0, Math.min(255, outval[2])))];
    }
    else if (cbType == 2) {
        //console.log('convert to prot');
        let outval = mjdot(rgbArr, prot);
        return [Math.round(Math.max(0, Math.min(255, outval[0]))),
        Math.round(Math.max(0, Math.min(255, outval[1]))),
        Math.round(Math.max(0, Math.min(255, outval[2])))];
    }
    else if (cbType == 3) {
        //console.log('convert to trit');
        let outval = mjdot(rgbArr, trit);
        return [Math.round(Math.max(0, Math.min(255, outval[0]))),
        Math.round(Math.max(0, Math.min(255, outval[1]))),
        Math.round(Math.max(0, Math.min(255, outval[2])))];
    }
    else if (cbType == 4) {
        //convert to grayscale
        const r = rgbArr[0] * .3; // ------> Red is low
        const g = rgbArr[1] * .59; // ---> Green is high
        const b = rgbArr[2] * .11; // ----> Blue is very low

        const gray = Math.round(r + g + b);
        // console.log(gray)
        return [gray, gray, gray]
    }
}

function mjdot(rgbArr, cbarr) {
    var output = [];
    for (var i = 0; i < 3; i++) { //row
        //console.log(cbarr[i]);
        output[i] = cbarr[0][i] * rgbArr[0] + cbarr[1][i] * rgbArr[1] + cbarr[2][i] * rgbArr[2];
    }
    //console.log(output);
    return output;
}


// Define the basic CIELAB conversion functions
// from https://github.com/antimatter15/rgb-lab/blob/master/color.js 
// the following functions are based off of the pseudocode
// found on www.easyrgb.com

function lab2rgb(lab) {
    var y = (lab[0] + 16) / 116,
        x = lab[1] / 500 + y,
        z = y - lab[2] / 200,
        r, g, b;

    x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.2040 + z * 1.0570;

    r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
    g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
    b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;

    return [Math.max(0, Math.min(1, r)) * 255,
    Math.max(0, Math.min(1, g)) * 255,
    Math.max(0, Math.min(1, b)) * 255]
}


function rgb2lab(rgb) {
    var r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        x, y, z;

    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
    y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
    z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function hexToRgbArr(hex) {
    var clr_rgb = hexToRgb(hex);
    return [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']];
}

//add here: rgb to hex
function rgbToHex(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substring(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

function rgbArrTorgb(rgb) {
    return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}

function rgbToCmyk(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const k = +(1 - Math.max(r, g, b)).toFixed(2);
    const c = +((1 - r - k) / (1 - k) || 0).toFixed(2);
    const m = +((1 - g - k) / (1 - k) || 0).toFixed(2);
    const y = +((1 - b - k) / (1 - k) || 0).toFixed(2);

    return [c, m, y, k];
}

function rgbArrToHex(rgb) {
    //console.log(rgb)
    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    // console.log(r+g+b)
    return "#" + r + g + b;
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB) {
    var deltaL = labA[0] - labB[0];
    var deltaA = labA[1] - labB[1];
    var deltaB = labA[2] - labB[2];
    var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    var deltaC = c1 - c2;
    var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    var sc = 1.0 + 0.045 * c1;
    var sh = 1.0 + 0.015 * c1;
    var deltaLKlsl = deltaL / (1.0);
    var deltaCkcsc = deltaC / (sc);
    var deltaHkhsh = deltaH / (sh);
    var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}

function rgbToHsl(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substring(4).split(")")[0].split(sep);

    // Make r, g, and b fractions of 1
    let r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    // Calculate hue
    // No difference
    if (delta == 0)
        h = 0;
    // Red is max
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;
    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    // return " hsl(" + h + ", " + s + "%, " + l + "%)";
    return [h, s, l]
};

// return array of [r,g,b,a] from any valid color. if failed returns undefined
function colorValues(color) {
    if (color === '')
        return;
    if (color[0] === '#') {
        if (color.length < 7) {
            // convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
            color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
        }
        return [parseInt(color.substr(1, 2), 16),
        parseInt(color.substr(3, 2), 16),
        parseInt(color.substr(5, 2), 16),
        color.length > 7 ? parseInt(color.substr(7, 2), 16) / 255 : 1];
    }
    if (color.indexOf('rgb') === -1) {
        // convert named colors
        var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
        var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
        temp_elem.style.color = flag;
        if (temp_elem.style.color !== flag)
            return; // color set failed - some monstrous css rule is probably taking over the color of our object
        temp_elem.style.color = color;
        if (temp_elem.style.color === flag || temp_elem.style.color === '')
            return; // color parse failed
        color = getComputedStyle(temp_elem).color;
        document.body.removeChild(temp_elem);
    }
    if (color.indexOf('rgb') === 0) {
        if (color.indexOf('rgba') === -1)
            color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
        return color.match(/[\.\d]+/g).map(function (a) {
            return +a
        });
    }
}
