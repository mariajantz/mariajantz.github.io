
genDivsGrid(4);

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
            cell.style.backgroundColor = genColor();
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
                colorpicker.value = cell.style.backgroundColor;
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
    e.style.gridTemplateRows = '250px 100px 100px 100px';
    e.style.gap = '10px';
    e.style.alignItems = 'stretch';
    //label column
    //e.style.gridTemplateAreas = '""';
}

function genColor(){
    // for now just random color
    r = Math.floor(Math.random()*255)
    g = Math.floor(Math.random() * 255)
    b = Math.floor(Math.random() * 255)
    return 'rgb(' + r.toString() + ', ' + g.toString() + ', ' + b.toString() + ')'
}

function updateColors() {
    //first check if the number of colors included is the same as the number of divs
    //if not, delete any extra divs (last child in each row of target) and resize all of them 
    //if it is the same number, regenerate each child element
    //get all the existing divs in target - normal, then update the colors (for now use random colors)
    var normblocks = document.getElementById("target").childNodes;
    var num_clrs = document.getElementById('num_clrs').value;
    var num_cols = normblocks.length / 4;
    console.log(num_cols)
    console.log(num_clrs)
    if ((num_cols - 1) != num_clrs) {
        console.log('Repopulate columns')
    }
    //add array to update 
    var locked = [];

    for (var c = 1; c < normblocks.length; c++) {
        if (normblocks[c].id != 'lbl') {
            //add here: check if that row is checked
            if (normblocks[c].className.includes('row-0')) {
                locked[c - 1] = normblocks[c].childNodes[1].checked;
            }
            if (!locked[c % num_cols - 1]) {
                normblocks[c].style.backgroundColor = genColor();
                if (normblocks[c].className.includes('row-0')) {
                    normblocks[c].childNodes[0].value = normblocks[c].style.backgroundColor;
                }
            }
        }
    }

}

function manualColor(cellnum){
    //get the button that was selected
    var clr_hex = document.getElementsByClassName('edit-color')[cellnum - 1].value; 
    let clr_rgb = hexToRgb(clr_hex);

    //get the parent div
    var cols = document.getElementsByClassName('col-' + cellnum.toString()); 
    //console.log(cols)
    
    //change parent background color
    cols[0].style.backgroundColor = clr_hex.toString();

    //get all the elements of the same column and change their background colors
    //based on colorblindness
    let clr_deut = toCB([clr_rgb['r'], clr_rgb['g'], clr_rgb['b']], 1);
    console.log(clr_deut)
    console.log(rgbToHex('rgb(' + clr_deut[0].toString() + ', ' + clr_deut[1].toString() + ', ' + clr_deut[2].toString() + ')'));
    cols[1].style.backgroundColor = 'rgb(' + clr_deut[0].toString() + ', ' + clr_deut[1].toString() + ', ' + clr_deut[2].toString() + ')'; 

    let clr_prot = toCB([clr_rgb['r'], clr_rgb['g'], clr_rgb['b']], 2);
    console.log(clr_prot)
    cols[2].style.backgroundColor = 'rgb(' + clr_prot[0].toString() + ', ' + clr_prot[1].toString() + ', ' + clr_prot[2].toString() + ')'; 

    let clr_trit = toCB([clr_rgb['r'], clr_rgb['g'], clr_rgb['b']], 3);
    console.log(clr_trit)

    cols[3].style.backgroundColor = 'rgb(' + clr_trit[0].toString() + ', ' + clr_trit[1].toString() + ', ' + clr_trit[2].toString() + ')'; 

}

function toCB(rgbArr, cbType) {
    //where colorblindness type is 0 (normal), 1 (deut), 2 (prot), or 3 (trit)
    //colorblind matrices (Machado et al 2009)
    let deut1 = [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]; 
    let deut = [[0.367322,  0.280085, -0.01182], [0.860646,  0.672501,  0.04294], [-0.227968, 0.047413, 0.968881]] //most common - green blind
    let prot = [[0.152286,  0.114503, -0.003882], [1.052583, 0.786281, -0.048116], [-0.204868, 0.099216, 1.051998]]; //next most common - red blind
    let trit = [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]] //least common - blue blind

    //matrix multiplication

    //right now assume no translation, just return value
    if (cbType==0) {
        return rgbArr;
    } else if (cbType == 1) {
        console.log('convert to deut');
        let outval = mjdot(rgbArr, deut);
        return [Math.round(Math.max(0, Math.min(255, outval[0])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[1])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[2])) * 10) / 10];
    }
    else if (cbType == 2) {
        console.log('convert to prot');
        let outval = mjdot(rgbArr, prot);
        return [Math.round(Math.max(0, Math.min(255, outval[0][0])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[1])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[2])) * 10) / 10];
    }
    else if (cbType == 3) {
        console.log('convert to trit');
        let outval = mjdot(rgbArr, trit);
        return [Math.round(Math.max(0, Math.min(255, outval[0][0])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[1])) * 10) / 10,
        Math.round(Math.max(0, Math.min(255, outval[2])) * 10) / 10];
    }
}

function mjdot(rgbArr, cbarr) {
    var output = [];
    for (var i = 0; i < 3; i++) { //row
        //console.log(cbarr[i]);
        //output[i] = cbarr[0][i] * rgbArr[i] + cbarr[1][i] * rgbArr[i] + cbarr[2][i] * rgbArr[i];
        output[i] = cbarr[0][i] * rgbArr[0] + cbarr[1][i] * rgbArr[1] + cbarr[2][i] * rgbArr[2];
    }
    console.log(output);
    return output;
}

function matrixDot(A, B) {
    //call: var a = [[8, 3], [2, 4], [3, 6]]
    //var b = [[1, 2, 3], [4, 6, 8]]
    //matrixDot(a,b)
    var result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));

    return result.map((row, i) => {
        return row.map((val, j) => {
            return A[i].reduce((sum, elm, k) => sum + (elm * B[k][j]), 0)
        })
    })
}


function dotproduct(a, b) {
    return a.map(function (x, i) {
        return a[i] * b[i];
    }).reduce(function (m, n) { return m + n; });
}

function restoreDefaultValues() {
    document.getElementById("num_clrs").value = 4; 
    document.getElementById('min_bright').value = 30;  
    document.getElementById("max_bright").value = 80;
    document.getElementById('min_dist').value = 0; 
    document.getElementById('deut_check').checked = true;
    document.getElementById('prot_check').checked = true;
    document.getElementById('trit_check').checked = true;
    document.getElementById('gb_check').checked = false;
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
    rgb = rgb.substr(4).split(")")[0].split(sep);

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