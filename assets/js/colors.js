//if you're reading this, please know I used this project to
//to teach myself javascript (and procrastinate on my dissertation) so the code is a bit messy

/*current things to consider adding: 
- make site input pretty
- add tooltips
- option to switch plot type to scatter? 
- drag and drop colors to change order (like this) https://stackoverflow.com/questions/73251435/drag-and-drop-cells-on-css-grid-only-works-properly-when-moving-a-cell-to-the-ri
- add a "show hues" option that gets the same color in lab space, diff brightness (not sure about best way to display this)

*/

genDivsGrid(5);
exportVals(); 

//collapsible instructions
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

//deal with example plot
function makeData(){
    //generate random points for the correct number of traces, based on number of input colors 
    var toprow = document.getElementsByClassName('row-0');
    var clrs = [];
    for (var c = 1; c < toprow.length; c++) {
        //if so, mark down the current color 
        clrs.push(toprow[c].childNodes[0].value);
    }
    console.log(clrs)

    const xvals = [1, 2, 3, 4, 5, 6, 7, 8]; 
    var all_traces = []; 
    for (var n=0; n<clrs.length; n++){
        let tmptrace = {
            name: 'trace ' + (n+1), 
            x: xvals, 
            y: Array.from({ length: xvals.length }, () => Math.floor(Math.random() * 10 + n*2)),
            line: {
                color: clrs[n], 
                width: 3
            }
        }
        all_traces.push(tmptrace);
    }
    return all_traces
}

var layout = {
    showlegend: true,
    height: 275, 
    margin: {
        l: 20,
        r: 20,
        b: 20,
        t: 20,
        pad: 4
    },
}

Plotly.newPlot('plots', makeData(), layout, {
    responsive: true,
    displaylogo: false, 
    staticPlot: true 
});

function restylePlot() {
    var ele = document.getElementsByClassName('plotcolors');
    var row0 = document.getElementsByClassName('row-0');
    var graphDiv = document.getElementById('plots')
    for (var i = 0; i < ele.length; i++) {
        if (ele[i].checked) {
            //get the new color for each trace and set it
            for (var j=0; j<graphDiv.data.length; j++){
                // Choose correct separator
                let rgb = row0[j + 1].style.backgroundColor; 
                let sep = rgb.indexOf(",") > -1 ? "," : " ";
                // Turn "rgb(r,g,b)" into [r,g,b]
                rgb = rgb.substring(4).split(")")[0].split(sep);
                let update = {
                    'line.color': rgbArrToHex(toCB(rgb, i))
                };
                Plotly.restyle(graphDiv, update, j);
            }
            
        }
    }
}


function genDivsGrid(cols) {
    var e = document.getElementById("target");
    var rows = 4;
    const col_lbl = cols +1; 
    const row_lbls = ['Full color', 'Deuteranopia', 'Protanopia', 'Tritanopia'];
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < col_lbl; c++) {
            var cell = document.createElement('div'); 
            //name each cell so normal, extras get 
            cell.className = "grid-cell row-" + r.toString() + ' col-' + c.toString();
            const colval = c; 
            cell.style.backgroundColor = '#888888';
            //cell.innerHTML = r+c;
            if (c==0) {
                cell.id = 'lbl';
                cell.style.backgroundColor = 'white';
                cell.innerHTML = row_lbls[r];
            }
            //else if row 0 add a checkbox (locked/unlocked) to the grid cell
            else if (r==0) {
                var colorpicker = document.createElement('input');
                colorpicker.type = 'color';
                colorpicker.className = 'edit-color';
                colorpicker.oninput = () => {manualColor(colval);};
                //colorpicker.addEventListener('click', manualColor)
                //could also try add event listener
                cell.appendChild(colorpicker); 
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; 
                checkbox.className = 'lock';
                cell.appendChild(checkbox);
                cell.style.justifyItems = 'end';
            }
            e.appendChild(cell);
        }
    }
    //style table
    e.style.display = 'grid';
    e.style.gridTemplateColumns = '100px' + ' auto'.repeat(cols);
    e.style.gridTemplateRows = '15em 4em 4em 4em';
    e.style.gap = '10px';
    e.style.alignItems = 'stretch';

    updateColors()
    //label column
    //e.style.gridTemplateAreas = '""';
}

function randColor(){
    // for now just random color
    r = Math.floor(Math.random() * 255)
    g = Math.floor(Math.random() * 255)
    b = Math.floor(Math.random() * 255)
    //return 'rgb(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ')'
    //check brightness (in LAB space)
    let minL = +document.getElementById('min_bright').value; 
    let maxL = +document.getElementById('max_bright').value; 
    let labclr = rgb2lab([r, g, b]);

    let cutoff = 1.5;
    let tmp = Math.max(r, g, b) / Math.min(r, g, b);
    if (tmp < cutoff) { //try some numbers up to about 1.8
        //console.log('rm color')
        labclr[0] = minL - 1;
    }

    while (minL>labclr[0] || maxL<labclr[0]) {
        r = Math.floor(Math.random() * 255)
        g = Math.floor(Math.random() * 255)
        b = Math.floor(Math.random() * 255)
        //check brightness (in LAB space)
        labclr = rgb2lab([r, g, b])
        //clear out if too gray
        tmp = Math.max(r, g, b) / Math.min(r, g, b);
        //console.log('tmp', tmp)
        if (tmp < cutoff) { //try some numbers up to about 1.8
            //console.log('rm color')
            labclr[0] = minL-1; 
        }
    }
    // console.log([r, g, b])
    return [r, g, b];
}

function validBright(elem){
    let minL = document.getElementById('min_bright').value;
    let maxL = document.getElementById('max_bright').value;
    //also reset if out of range, which is allowed manually but not clicking
    if (minL > 90){
        document.getElementById('min_bright').value = 90; 
    }
    if (maxL > 100) {
        document.getElementById('max_bright').value = 100;
    }
    if (minL < 0) {
        document.getElementById('min_bright').value = 0;
    }
    if (maxL < 10) {
        document.getElementById('max_bright').value = 10;
    }

    if (minL >= (maxL - 10)) {
        //if the calling element is max, then change min; if the calling element is min, then change max
        //require at least 10 between them
        let e = document.getElementById(elem.id)

        if (elem.id.includes('max')) {
            document.getElementById('min_bright').value = +e.value - 10; 
        } else if (elem.id.includes('min')) {
            document.getElementById('max_bright').value = +e.value + 10; 
        } 
    }
}

function genCandidates(num_clrs, cur_clrsRgb){
    //generate a set of x rgb colors for Mitchell's best-candidate algorithm and return the best one
    console.log('gen')
    var cands = []; 
    var minlist = []; //list of minimum distances
    //convert current color array to lab (normal)
    var nRgb = []; 
    for (var j = 0; j<cur_clrsRgb.length; j++) {
        nRgb.push(rgb2lab(cur_clrsRgb[j])); 
    }

    //get which colorblindness types are checked (d, p, t) in addition to normal min distance
    const cb_inc = [document.getElementById('deut_check').checked, 
        document.getElementById('prot_check').checked, 
        document.getElementById('trit_check').checked]
    var cb_current = []
    //convert current color array to colorblind lab spaces
    for (var i = 0; i<cb_inc.length; i++) {
        cb_current.push([])
        if (cb_inc[i]) {
            //convert and add the array
            for (var j = 0; j<cur_clrsRgb.length; j++) {
                tmp = rgb2lab(toCB(cur_clrsRgb[j], i)); 
                cb_current[i].push(tmp)
            }
        }
    }
    //generate candidate colors (randomly) and pick the one that has the highest min distance
    for (var i = 0; i<num_clrs; i++) {
        cands[i] = randColor(); 
        //get distances from existing set of colors, normal vision
        let tmpmins = []; 
        for (var k = 0; k<cur_clrsRgb.length; k++) {
            tmpmins.push(deltaE(rgb2lab(cands[i]), nRgb[k])); 
            //TODO decide whether to normalize this minimum value for each space
        }
        minlist.push(Math.min(...tmpmins)) //only add the closest neighbor
    }
    for (var i=0; i<num_clrs; i++){
        //convert all to colorblind (in spaces currently checked) and to lab
        for (var j = 0; j < cb_inc.length; j++){
            if (cb_inc[j]){
                for (var k = 0; k < cur_clrsRgb.length; k++) {
                    let cb = rgb2lab(toCB(cands[i], (j+1)));
                    //get distances of each from existing set of colors; set to minlist if lower than current value
                    let cmin = deltaE(cb, cb_current[j][k]); 
                    if (cmin<minlist[k]){
                        //then the new minimum distance is in these terms
                        minlist[k] = cmin; 
                    }
                }
            }
        }
    }
    //return the max from the minlist
    const maxval = Math.max(...minlist); 
    const idx = minlist.indexOf(maxval);
    return cands[idx]
}

function exportVals(){
    var radios = document.getElementsByClassName('export_values'); 
    var rchoose = 0;
    for (var r = 0; r<radios.length; r++){
        if (radios[r].checked){
            rchoose = r;
        }
    }
    console.log(rchoose); 

    //depending which radio button is selected, cycle through the colors and get their values in that format
    var row0 = document.getElementsByClassName('row-0'); 
    var clst = []; 
    for (var c = 1; c<row0.length; c++){
        if (rchoose==0){
            clst.push(' [' + row0[c].style.backgroundColor.slice(4, -1) + ']');
        } else if (rchoose==1){
            clst.push(' ' + rgbToHex(row0[c].style.backgroundColor)); 
        } else if (rchoose==2) {
            clst.push(rgbToHsl(row0[c].style.backgroundColor))
        }
    }

    //TODO format: then print them to the screen in the designated column
    var output = document.getElementById('export_text')
    output.innerHTML = clst;
}

function runMitchell(){
    //generate colors
    let num_gen = 10; //number of candidates to run mitchell's on
    //get any locked colors
    //if there are locked elements, use those as starting colors; otherwise use rand color
    var row0 = document.getElementsByClassName('row-0'); 
    var st_clrs = []; 
    for (var c = 1; c<row0.length; c++){
        if (row0[c].childNodes[1].checked) {
            st_clrs.push(hexToRgbArr(row0[c].childNodes[0].value));
        }
    }
    let keepclrs = JSON.parse(JSON.stringify(st_clrs)); //locked colors deep copy
    if (st_clrs.length==0) {
        st_clrs.push(randColor()); 
    }

    let num_clrs = +document.getElementById('num_clrs').value;
    let total_cands = (num_clrs-keepclrs.length)*3 //extra candidates to generate before sorting all
    //here, run this x number of times to get more candidates than called for
    for (var i = 0; i<total_cands; i++){
        st_clrs.push(genCandidates(num_gen, st_clrs)); 
    }
    //console.log(st_clrs); 

    //now sort them; if certain colors are locked then make those required and get dists from everything else
    //console.log(keepclrs.length)
    if (keepclrs.length == 0) {
        //sort with no locked
        console.log('sort no lock')
        //get minimum distance between every color across all checked color spaces
        //sort by maximum
        //OR get minimum across all checked color spaces, eliminate the worst ones for each space, then combine
        var new_clrs = sortColors(st_clrs, []); 
    } else {
        //sort with locked
        console.log('partial sort')
        //loop - get minimum distance to locked colors, get next minimum distance including that color
        var new_clrs = sortColors(st_clrs.slice(keepclrs.length), keepclrs)
    }
    console.log(new_clrs)
    //temporarily: just show these (update colors of cols)
    for (var i = 0; i<num_clrs; i++){
        updateColumnColors('col-' + (i+1).toString(), new_clrs[i])
        let e = document.getElementsByClassName('row-0 col-' + (i+1).toString());
        e[0].childNodes[0].value = rgbArrToHex(new_clrs[i]);
    }

    //okay, so now that I have a set of candidates that should be relatively separated...
    //sort these candidates by distance in each color space
    //remove the least-distinguishable x number in each space
}

function sortColors(clr_list, ref_clrs) {
    //inputs: an rgb list of colors, an rgb list of locked colors
    //by default this sorts in terms of rgb and deuteranopia, which are the most common, regardless of what is checked
    //I think, based on python tests, that the best way to do this is: 
    //what if I knock out least distinguishable and then just sort by the median? 
    let all_clrs = [...ref_clrs, ...clr_list]; 
    //find distances between everything
    var cdist = [] //change below to i<all_clrs.length
    
    for (var i = 0; i < all_clrs.length; i++){
        cdist.push([])
        //todo this is non symmetrical why
        for (var j = 0; j < all_clrs.length; j++){
            let rgbtmp = Math.min(deltaE(rgb2lab(all_clrs[i]), rgb2lab(all_clrs[j])), deltaE(rgb2lab(all_clrs[j]), rgb2lab(all_clrs[i]))); 
            let dtmp = Math.min(deltaE(rgb2lab(toCB(all_clrs[i], 1)), rgb2lab(toCB(all_clrs[j], 1))), deltaE(rgb2lab(toCB(all_clrs[j], 1)), rgb2lab(toCB(all_clrs[i], 1)))); 

            cdist[i].push(Math.min(dtmp, rgbtmp))
        }
    }

    //then knock out one of a pair of colors that is difficult to distinguish in any space, but only allow knocking out clr_list colors not ref (locked)
    //then return the list sorted by median distance
    //change to i=ref_clrs.length; i<all_clrs.length
    var closelbl = Array(cdist.length);
    closelbl.fill(-1); 
    for (var i = ref_clrs.length; i < all_clrs.length; i++){
        //calculate the median distances in each row, and if there are any values in the row less than 10
        //they are not likely to be distinguishable so subtract from median to move it down the list?
        //but that should only apply to one of a pair
        if (i<cdist.length) {
            var tmpArr = cdist[i].slice(0, i).concat(cdist[i].slice(-(cdist[i].length - i - 1))); //ignore 0s on diagonal
        } else {
            var tmpArr = cdist[i].slice(0, i); //ignore 0s on diagonal
        }
        
        let tmpVal = Math.min(...tmpArr); 
        if (tmpVal<15){ //perceptible distance for large boxes of color is about 6; this gives some wiggle room
            //mark these ones and later remove/put at end the one with the lower median
            const closeClr = cdist[i].indexOf(tmpVal);
            closelbl[i] = closeClr;
        }
    }
    var cmedians = cdist.map(x => median(x));
    //now remove the colors that are close to each other - 
    //first, remove a color if it appears more than once in the list
    //then choose pair value with lower median

    const clrcount = {};
    for (const num of closelbl) {
        clrcount[num] = clrcount[num] ? clrcount[num] + 1 : 1;
    }
    //find the instances where values list here are >1, if any
    for (var i=0; i<Object.keys(clrcount).length; i++){

        if (Object.keys(clrcount)[i]==-1){
            //pass
        }else if (Object.values(clrcount)[i]>1){
            //push relevant key to end of list (this just doesn't do anything if it's locked)
            cmedians[Object.keys(clrcount)[i]] = 0; 
        }
    }
    
    //remove 1/3 of the list of close values based on medians
    var closemedians = Object.keys(clrcount).map(x => cmedians[x]);
    closemedians = closemedians.filter(Boolean);
    closemedians.sort((a, b) => a - b)
    closemedians = closemedians.slice(0, Math.floor(closemedians.length / 3))
    for (var i=0; i<closemedians.length; i++){
        let idx = cmedians.indexOf(closemedians[i]); 
        cmedians[idx] = 0; 
    }

    // console.log(cmedians)
    // console.log(ref_clrs)
    // console.log(clr_list)
    //finally, ignore the rows with zeroed medians, recalc all medians, sort, and preserve the reference/locked colors
    //if 0 value occurs before length of ref_clrs, replace it with its median
    for (var i= 0; i<ref_clrs.length; i++){
        if (cmedians[i]==0){
            cmedians[i] = median(cdist[i]);
        }
    }
    // console.log(cmedians)
    //if 0 value occurs after ref_clrs just remove that row from the list
    var output = []; 
    for (var i = 0; i<all_clrs.length; i++){
        if (cmedians[i] != 0) {
            output.push(all_clrs[i]);
        }
    }

    //now cycle through everything left and sort - minimum minimum distance at the end, remove it from other mins
    var cdist = []; 
    for (var i = 0; i<output.length; i++){
        cdist.push([]);
        for (var j = 0; j < output.length; j++) {
            //convert the color to deut, then lab
            //calculate distance
            let dtmp = Math.min(deltaE(rgb2lab(toCB(output[i], 1)), rgb2lab(toCB(output[j], 1))), deltaE(rgb2lab(toCB(output[j], 1)), rgb2lab(toCB(output[i], 1)))); 
            cdist[i].push(dtmp);
        }
    }
    console.log('new cdist')
    console.log(cdist)
  
    //console.log([...ref_clrs, ...clr_list])
    //const output = sorted_idx.map(i => all_clrs[i]); //...okay honestly what works best is kmeans I think
    return output//all_clrs //combine the locked colors with the sorted ones
}

function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function sortIndex(arr_in) {
    var numbers = Array.from(arr_in);
    var sorted = Array.from(numbers).sort((a, b) => a - b);
    //const map2 = sorted.map(x => numbers.indexOf(x));
    var outval = []; 
    for (var i =0; i<numbers.length; i++){
        //get index of numbers value in sorted array
        outval.push(numbers.indexOf(sorted[i])); 
        numbers[outval.at(-1)] = -1; 
    }
    //return the sorted indices without changing original array
    return outval
}

function updateColors() {
    //first check if the number of colors included is the same as the number of divs
    //if not, delete any extra divs (last child in each row of target) and resize all of them 
    //if it is the same number, regenerate each child element
    //get all the existing divs in target - normal, then update the colors (for now use random colors)
    var gridParent = document.getElementById('target'); 
    //var normblocks = gridParent.childNodes;
    var num_clrs = parseInt(document.getElementById('num_clrs').value);
    var num_cols = gridParent.childElementCount / 4 ;
    //check for locked columns: set the first x columns of the array to be locked and assign the colors there
    //TODO: can I do this after add columns but before remove columns? then add a check for the mode-random situation
    //if it's interpolated put second one all the way to the right
    const numlocked = setLocked(+num_cols, +num_clrs); 

    if ((num_cols - 1) < num_clrs) {
        //console.log('Add columns')
        addColumns(num_clrs, num_cols, gridParent);
        var addcol = true; 
    } 


    if ((num_cols - 1) > num_clrs) {
        //console.log('Subtract columns')
        rmColumns(num_clrs, num_cols, gridParent);
    }

    //reload these values
    var normblocks = gridParent.childNodes;
    //var num_cols = normblocks.length / 4 ;

    //add array to update depending on radio button
    if (document.getElementById('mode-random').checked){
        runMitchell();
    } else if (document.getElementById('mode-uniform').checked && numlocked<=2){
        interpVals(); 
        if (addcol) {
            //deal with locking if there are two locked colors + added vals
            normblocks[num_clrs].childNodes[1].checked = true; 
            normblocks[num_cols-1].childNodes[1].checked = false; 
        }
    } else {
        //MULTI-HUE WITH STEP CORRECTION
        //this is in line with: https://www.vis4.net/blog/2013/09/mastering-multi-hued-color-scales/
        interpMulti(); 
    }
    
    //update export
    exportVals(); 
    Plotly.newPlot('plots', makeData(), layout, {
        responsive: true,
        displaylogo: false
    });
    restylePlot(); 
}

function interpVals() {
    //TODO deal with locking??
    //get random colors for 2 ends of spectrum 
    //interpolate between them
    //locked colors: only keep the first one
    var row0 = document.getElementsByClassName('row-0');
    var st_clrs = [];
    for (var c = 1; c < row0.length; c++) {
        if (row0[c].childNodes[1].checked) {
            st_clrs.push(hexToRgbArr(row0[c].childNodes[0].value));
        }
    }
    if (st_clrs.length == 0) {
        st_clrs.push(randColor());
        st_clrs.push(genCandidates(4, st_clrs));
    } else if (st_clrs.length ==1) {
        st_clrs.push(genCandidates(4, st_clrs));
    } else {
        st_clrs = st_clrs.slice(0, 2);
    }

    let num_clrs = +document.getElementById('num_clrs').value;
    
    //now there should be two colors to have as ends of spectrum; convert to lab and generate mid points
    let lab_clrs = st_clrs.map(x => rgb2lab(x)); 

    var newL = interpolateArray([lab_clrs[0][0], lab_clrs[1][0]], num_clrs);
    var newa = interpolateArray([lab_clrs[0][1], lab_clrs[1][1]], num_clrs);
    var newb = interpolateArray([lab_clrs[0][2], lab_clrs[1][2]], num_clrs);
    
    var new_clrs = newL.map(function (e, i) {
        return lab2rgb([e, newa[i], newb[i]]);
    });
    console.log(new_clrs)

    for (var i = 0; i < num_clrs; i++) {
        let tmpclr = new_clrs[i].map(x => Math.floor(x))
        updateColumnColors('col-' + (i + 1).toString(), tmpclr)
        let e = document.getElementsByClassName('row-0 col-' + (i + 1).toString());
        e[0].childNodes[0].value = rgbArrToHex(tmpclr);
    }
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
    console.log('interp multi')
    //this one assumes at least 3 values are checked. Therefore, it will do the following: 
    //Remember the checked colors
    //Do a Bezier interpolation between them in each dimension to smooth the curves
    //Do a lightness correction
    //average the Bezier and lightness correction
    //then figure out which colors are closest to original locked colors and check those boxes
    let num_clrs = +document.getElementById('num_clrs').value;
    var row0 = document.getElementsByClassName('row-0');
    var st_clrs = [];
    for (var c = 1; c < row0.length; c++) {
        if (row0[c].childNodes[1].checked) {
            st_clrs.push(row0[c].childNodes[0].value);
        }
    }
    //bezier interpolated colors
    var interp_clrs = chroma.bezier(st_clrs).scale().colors(num_clrs);
    //linearly interpolated colors
    var light_clrs = chroma.scale(st_clrs).colors(num_clrs)// 

    //average these two together to end up less grayish - do not bother with lightness correction unless checked
    var new_clrs = [];
    let smoothval = +document.getElementById('smoothing').value; 
    for (var i = 0; i < num_clrs; i++) {
        new_clrs.push(chroma.average([light_clrs[i], interp_clrs[i]], 'rgb', [(100-smoothval)/100, smoothval/100]));
    }
    if (document.getElementById('lightcorrect').checked) {
        //update lightness -- I don't like chroma does it so I convert to lab, get minimum and maximum end, and scale in between
        new_clrs = correctLight(new_clrs);
    }

    //get nearest value to each original color
    var near_idx = []; 
    for (var i=0; i<st_clrs.length; i++){
        //get distance to each of the colors
        let distTmp = [];
        for (var j=0; j<new_clrs.length; j++){
            distTmp.push(chroma.deltaE(st_clrs[i], new_clrs[j]))
        }
        //make minimum distance part of near idx to be checked
        near_idx.push(distTmp.indexOf(Math.min(...distTmp)))
    }

    for (var i = 0; i < num_clrs; i++) {
        let tmpclr = new_clrs[i];
        updateColumnColors('col-' + (i + 1).toString(), hexToRgbArr(tmpclr))
        let e = document.getElementsByClassName('row-0 col-' + (i + 1).toString());
        e[0].childNodes[0].value = tmpclr;
        if (near_idx.includes(i)){
            e[0].childNodes[1].checked = true; 
        } else {
            e[0].childNodes[1].checked = false; 
        }
        
    }

    //calculate the nearest values to the starting colors and check those boxes

}

function correctLight(hexClrArr){
    //convert hex to lab
    let labClr = []
    console.log('hello')
    for (var i=0; i<hexClrArr.length; i++){
        labClr.push(rgb2lab(hexToRgbArr(hexClrArr[i])));
    }
    console.log(labClr)
    //interpolate L values between beginning and end of array
    let newL = interpolateArray([labClr[0][0], labClr[labClr.length - 1][0]], hexClrArr.length);
    
    var newArr = []; 
    for (var i = 0; i < hexClrArr.length; i++) {
        let tmpClr = lab2rgb([newL[i], labClr[i][1], labClr[i][2]]);

        console.log([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]); 
        console.log(rgbArrToHex([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]))
        newArr.push(rgbArrToHex([Math.round(tmpClr[0]), Math.round(tmpClr[1]), Math.round(tmpClr[2])]))
    }
    console.log(newArr)

    return newArr
}


function setLocked(num_cols, num_clrs) {
    //for each column (top row) except the label, check if the checkbox is locked
    var toprow = document.getElementsByClassName('row-0'); 
    var clrs = []; 
    for (var c = 1; c < toprow.length; c++) {
        if (toprow[c].childNodes[1].checked){
            //if so, mark down the current color and uncheck the checkbox
            clrs.push(toprow[c].childNodes[0].value); 
        }
    }

    if (document.getElementById('mode-random').checked || clrs.length<=2) {
        //do NOT do this step for multi hue interpolation
        for (var c = 1; c < toprow.length; c++) {
            if (toprow[c].childNodes[1].checked) {
                //if so, mark down the current color and uncheck the checkbox
                toprow[c].childNodes[1].checked = false;
            }
        }
    }
    
    if (document.getElementById('mode-random').checked) {
        //after going through all the columns, set each column to a color, check those
        for (var i = 0; i < clrs.length; i++){
            toprow[(i+1)].childNodes[0].value = clrs[i]; 
            let clr_rgb = hexToRgb(clrs[i]);
    
            //get the parent div
            updateColumnColors('col-' + (i+1).toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
            toprow[i+1].childNodes[1].checked = true; 
        }
    } else if (clrs.length <= 2) {
        for (var i = 0; i < clrs.length; i++) {
            if (i == 0) {
                toprow[(i + 1)].childNodes[0].value = clrs[i];
                let clr_rgb = hexToRgb(clrs[i]);

                //get the parent div
                updateColumnColors('col-' + (i + 1).toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
                toprow[i + 1].childNodes[1].checked = true; 
            } else if (i == 1){
                if ((num_cols - 1) <= num_clrs) {
                    var rowidx = toprow.length-1; 
                    toprow[rowidx].childNodes[1].checked = true; 
                } else {
                    //subtract: check correct idx
                    var rowidx = num_clrs;
                    toprow[rowidx].childNodes[1].checked = true; 
                }
                toprow[rowidx].childNodes[0].value = clrs[i];
                let clr_rgb = hexToRgb(clrs[i]);

                //get the parent div
                updateColumnColors('col-' + (rowidx).toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
                
            }

        }
    }  
    //outputs number of locked columns
    return clrs.length
}

function addColumns(new_colCount, cur_colCount, parentDiv) {
    //if it's necessary to update the number of columns, call this 
    //var e = document.getElementById("target");
    //var normblocks = parentDiv.childNodes;
    //var start_col = normblocks.length / 4 + 1;
    var start_col = cur_colCount; 
    start_col++; 
    var rows = 4;

    //if larger, add as many columns of elements as desired
    //need to insert these after the previous rows
    let col_lbl = new_colCount; 
    col_lbl++; 
    for (var c = start_col; c <= col_lbl; c++){
        
        for (var r = 0; r < rows; r++) {
            //just add 1 column 
            //name each cell
            var cell = document.createElement('div');
            cell.className = "grid-cell row-" + r.toString() + ' col-' + (c - 1).toString();
            const colval = c-1;
            cell.style.backgroundColor = '#888888';
            //location to insert after
            lcname = "row-" + r.toString() + ' col-' + (c - 2).toString();
            lastcell = document.getElementsByClassName(lcname)[0];

            //if row 0 add a checkbox (locked/unlocked) to the grid cell
            if (r == 0) {
                var colorpicker = document.createElement('input');
                colorpicker.type = 'color';
                colorpicker.className = 'edit-color';
                colorpicker.oninput = () => { manualColor(colval); };
                //colorpicker.addEventListener('click', manualColor)
                //could also try add event listener
                cell.appendChild(colorpicker);
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'lock';
                cell.appendChild(checkbox);
                cell.style.justifyItems = 'end';
            }

            lastcell.after(cell);
        }
    }
    parentDiv.style.gridTemplateColumns = '100px' + ' auto'.repeat(new_colCount);
}

function rmColumns(new_colCount, cur_colCount, parentDiv) {
    //if it's necessary to update the number of columns, call this 
    let start_col = new_colCount;
    start_col++; 
    let end_col = cur_colCount - 1; 
    for (var c = start_col; c <= end_col; c++){
        const elements = document.getElementsByClassName('col-' + c.toString());
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
            //probably need to also remove sub children? 
        }
    }

    parentDiv.style.gridTemplateColumns = '100px' + ' auto'.repeat(new_colCount);
}

function manualColor(cellnum){
    //get the button that was selected
    var clr_hex = document.getElementsByClassName('edit-color')[cellnum - 1].value; 
    let clr_rgb = hexToRgb(clr_hex);
    //console.log(cols)
    updateColumnColors('col-' + cellnum.toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
    exportVals(); 
}

function updateColumnColors(colname, newRGBArr){
    //get the parent div
    var cols = document.getElementsByClassName(colname); 
    // console.log('update ')
    // console.log(cols)
    //change parent background color
    cols[0].style.backgroundColor = rgbArrToHex(newRGBArr);

    //get all the elements of the same column and change their background colors
    //based on colorblindness
    let clr_deut = toCB(newRGBArr, 1);
    //console.log(clr_deut)
    //console.log(rgbToHex('rgb(' + clr_deut[0].toString() + ', ' + clr_deut[1].toString() + ', ' + clr_deut[2].toString() + ')'));
    cols[1].style.backgroundColor = rgbArrToHex(clr_deut); 

    let clr_prot = toCB(newRGBArr, 2);
    //console.log(clr_prot)
    //cols[2].style.backgroundColor = 'rgb(' + clr_prot[0].toString() + ', ' + clr_prot[1].toString() + ', ' + clr_prot[2].toString() + ')'; 
    cols[2].style.backgroundColor = rgbArrToHex(clr_prot); 

    let clr_trit = toCB(newRGBArr, 3);
    //console.log(clr_trit)
    //cols[3].style.backgroundColor = 'rgb(' + clr_trit[0].toString() + ', ' + clr_trit[1].toString() + ', ' + clr_trit[2].toString() + ')'; 
    cols[3].style.backgroundColor = rgbArrToHex(clr_trit); 
}

function lblColors() {
    //go through top row of array, get color values in the format requested
    //first make selector

}

function showDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

function filterFunction() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}

function toCB(rgbArr, cbType) {
    //where colorblindness type is 0 (normal), 1 (deut), 2 (prot), or 3 (trit)
    //colorblind matrices (Machado et al 2009)
    let deut = [[0.367322,  0.280085, -0.01182], [0.860646,  0.672501,  0.04294], [-0.227968, 0.047413, 0.968881]]; //most common - green blind
    let prot = [[0.152286,  0.114503, -0.003882], [1.052583, 0.786281, -0.048116], [-0.204868, 0.099216, 1.051998]]; //next most common - red blind
    let trit = [[1.255528, -0.078411,  0.004733],[-0.076749,  0.930809,  0.691367], [-0.178779,  0.147602,  0.3039]]; //least common - blue blind

    //matrix multiplication

    //right now assume no translation, just return value
    if (cbType==0) {
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
    else if (cbType ==4) {
        //convert to grayscale
        const r = rgbArr[0] * .3; // ------> Red is low
        const g = rgbArr[1] * .59; // ---> Green is high
        const b = rgbArr[2] * .11; // ----> Blue is very low

        const gray = Math.round(r + g + b);
        console.log(gray)
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

function restoreDefaultValues() {
    document.getElementById("num_clrs").value = 5; 
    document.getElementById('min_bright').value = 40;  
    document.getElementById("max_bright").value = 80;
    //document.getElementById('min_dist').value = 0; 
    document.getElementById('deut_check').checked = true;
    document.getElementById('prot_check').checked = true;
    document.getElementById('trit_check').checked = true;
    document.getElementById('mode-random').checked = true; 
    //document.getElementById('gb_check').checked = false;

    document.getElementById('target').replaceChildren(); 
    genDivsGrid(4);
}

function defaultGradRange() {
    document.getElementById('min_bright').value = 0;
    document.getElementById("max_bright").value = 100;
    document.getElementById("num_clrs").setAttribute('max', 20)
}

function defaultRandRange() {
    document.getElementById('min_bright').value = 40;
    document.getElementById("max_bright").value = 80;
    document.getElementById("num_clrs").setAttribute('max', 12)
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

function rgbArrToHex(rgb){
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

    return " hsl(" + h + ", " + s + "%, " + l + "%)";
};