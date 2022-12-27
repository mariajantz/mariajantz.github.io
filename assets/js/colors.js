
genDivsGrid(4);

/*current TODOs: 
generate single candidates based on mitchell's
generate a set of candidates and choose a subset from those
actually show these candidates instead of the random stuff
make sure candidates play nice with locking and such
*/

function genDivsGrid(cols) {
    var e = document.getElementById("target");
    var rows = 4;
    const col_lbl = cols +1; 
    const row_lbls = ['Normal vision', 'Deuteranopia', 'Protanopia', 'Tritanopia'];
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
    e.style.gridTemplateRows = '20em 5em 5em 5em';
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
    let minL = document.getElementById('min_bright').value; 
    let maxL = document.getElementById('max_bright').value; 
    let labclr = rgb2lab([r, g, b])
    if (minL>=(maxL-5)) {
        console.log('add pass here? should really do an alert of some kind')
    }
    while (minL>labclr[0] || maxL<labclr[0]) {
        r = Math.floor(Math.random() * 255)
        g = Math.floor(Math.random() * 255)
        b = Math.floor(Math.random() * 255)
        //check brightness (in LAB space)
        labclr = rgb2lab([r, g, b])
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
    //generate a set of x rgb colors for Mitchell's best-candidate algorithm
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
        console.log('convert to cb')
        cb_current.push([])
        if (cb_inc[i]) {
            //convert and add the array
            for (var j = 0; j<cur_clrsRgb.length; j++) {
                tmp = rgb2lab(toCB(cur_clrsRgb[j], i)); 
                cb_current[i].push(tmp)
            }
        }
    }
    console.log(cb_current)
    //generate candidate colors (randomly) and pick the one that has the highest min distance
    for (var i = 0; i<num_clrs; i++) {
        console.log('generate candidate')
        cands[i] = randColor(); 
        //get distances from existing set of colors, normal vision
        for (var k = 0; k<cur_clrsRgb.length; k++) {
            minlist.push(deltaE(rgb2lab(cands[i]), nRgb[k])); 
            //TODO decide whether to normalize this minimum value for each space
            //console.log(minlist)
        }
        console.log(minlist)
        console.log(i)
        //convert all to colorblind (in spaces currently checked) and to lab
        for (var j = 1; j <= cb_inc.length; j++){
            console.log('cb mins')
            if (cb_inc[j]){
                for (var k = 0; k < cur_clrsRgb.length; k++) {
                    let cb = rgb2lab(toCB(cands[i], j));
                    //get distances of each from existing set of colors; set to minlist if lower than current value
                    let cmin = deltaE(cb, cb_current[j][k]); 
                    console.log(cmin, minlist[k])
                    //todo this is somehow only changing the first index of minlist? write out what j, k, i are
                    if (cmin<minlist[k]){
                        console.log('change ' + k)
                        //then the new minimum distance is in these terms
                        minlist[k] = cmin; 
                    }
                }
            }
        }
        console.log('new mins')
        console.log(minlist)

    }
    //temporary testing: display these colors and their respective values onscreen (set inner html of each)
    //return the max from the minlist
    const maxval = Math.max(...minlist); 
    const idx = minlist.indexOf(maxval);
    console.log(maxval); 
    console.log(idx)
    console.log(cands)
    return cands[idx]
}


function runMitchell(){
    //generate colors
    let num_gen = 3; //number of candidates to run mitchell's on
    let tmp_first = [randColor(), randColor()]; 
    let total_cands = (+document.getElementById('num_clrs').value)*3 //extra candidates to generate before sorting all
    console.log(total_cands)
    //here, run this x number of times to get more candidates than called for
    let tmp = genCandidates(num_gen, tmp_first); 
    
    //temporarily: just show these (update colors of cols)
    updateColumnColors('col-' + (1).toString(), tmp_first[0])
    updateColumnColors('col-' + (2).toString(), tmp_first[1])
    updateColumnColors('col-' + (3).toString(), tmp)
    //okay, so now that I have a set of candidates that should be relatively separated...
    //sort these candidates by distance in each color space
    //remove the least-distinguishable x number in each space
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
    setLocked(); 

    if ((num_cols - 1) < num_clrs) {
        //console.log('Add columns')
        addColumns(num_clrs, num_cols, gridParent);
    } else if ((num_cols - 1) > num_clrs) {
        //console.log('Subtract columns')
        rmColumns(num_clrs, num_cols, gridParent);
    }

    //reload these values
    var normblocks = gridParent.childNodes;
    var num_cols = normblocks.length / 4 ;

    //add array to update 
    var locked = [];
    var clrs = [];
    for (var c = 1; c < normblocks.length; c++) {
        if (normblocks[c].id != 'lbl') {
            //check if that row is checked
            if (normblocks[c].className.includes('row-0')) {
                locked[c - 1] = normblocks[c].childNodes[1].checked;
                clrs[c - 1] = randColor();
            }
            if (!locked[c % num_cols - 1]) {
                let bgc = clrs[c % num_cols - 1];
                if (normblocks[c].className.includes('row-0')) {
                    let bgc_hex = rgbArrToHex(bgc)
                    normblocks[c].style.backgroundColor = bgc_hex;
                    normblocks[c].childNodes[0].value = bgc_hex;
                } //otherwise use same value as in row 0
                else {
                    rownum = parseInt(normblocks[c].className.split('row-')[1].charAt(0));
                    // Choose correct separator
                    let sep = bgc.indexOf(",") > -1 ? "," : " ";
                    // Turn "rgb(r,g,b)" into [r,g,b]
                    // bgc = bgc.substring(4).split(")")[0].split(sep);
                    // bgc = bgc.map(Number);
                    normblocks[c].style.backgroundColor = rgbArrToHex(toCB(bgc, rownum));
                }
            }
        }
    }
}

function setLocked() {
    //for each column (top row) except the label, check if the checkbox is locked
    var toprow = document.getElementsByClassName('row-0'); 
    var clrs = []; 
    for (var c = 1; c < toprow.length; c++) {
        if (toprow[c].childNodes[1].checked){
            //if so, mark down the current color and uncheck the checkbox
            clrs.push(toprow[c].childNodes[0].value); 
            toprow[c].childNodes[1].checked = false; 
        }
    }
    
    //after going through all the columns, set each column to a color, check those
    for (var i = 0; i < clrs.length; i++){
        toprow[(i+1)].childNodes[0].value = clrs[i]; 
        let clr_rgb = hexToRgb(clrs[i]);
        console.log(clr_rgb); 
        //get the parent div
        updateColumnColors('col-' + (i+1).toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
        toprow[i+1].childNodes[1].checked = true; 
    }
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

    //get the parent div
    var cols = document.getElementsByClassName('col-' + cellnum.toString()); 
    //console.log(cols)
    updateColumnColors('col-' + cellnum.toString(), [clr_rgb['r'], clr_rgb['g'], clr_rgb['b']])
}

function updateColumnColors(colname, newRGBArr){
    //get the parent div
    var cols = document.getElementsByClassName(colname); 
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
    document.getElementById("num_clrs").value = 4; 
    document.getElementById('min_bright').value = 30;  
    document.getElementById("max_bright").value = 80;
    document.getElementById('min_dist').value = 0; 
    document.getElementById('deut_check').checked = true;
    document.getElementById('prot_check').checked = true;
    document.getElementById('trit_check').checked = true;
    //document.getElementById('gb_check').checked = false;

    document.getElementById('target').replaceChildren(); 
    genDivsGrid(4);
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