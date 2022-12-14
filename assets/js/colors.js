var num_divs = document.getElementById('num_clrs').value

// genDivs(num_divs, 'normal', 'normal')
// genDivs(num_divs, 'colorblind', 'deuteranopia')
// genDivs(num_divs, 'colorblind', 'protanopia')
// genDivs(num_divs, 'colorblind', 'tritanopia')

genDivsGrid(num_divs);

function genDivs(cols, rowname, rowid){
    var e = document.getElementById("target");
    var rows = 1
    for (var r = 0; r < rows; r++) {
        var row = document.createElement("div");
        row.className = rowname;
        row.id = rowid; 
        var fullwd = row.style.width; 
        console.log(fullwd)
        //before starting, make a div with a label
        var lbl = document.createElement("div");
        lbl.className = "columns lbl";
        lbl.innerHTML = rowid;
        lbl.style.width = '100px';
        row.appendChild(lbl)
        for (var c = 0; c < cols; c++) {
            var col = document.createElement("div");
            let tmp = c+1;
            col.className = "columns project-" + tmp.toString();
            //col.innerHTML = (r * rows) + c;
            //CSS changes: 
            //change width of these boxes to fill the space
            cwidth = Math.floor((fullwd-100)/cols-2*(cols+1)*(fullwd/200)); 
            col.style.width = cwidth.toString() + 'px';
            //col.style.width = cwidth.toString() + '%';
            //then put a color here
            col.style.backgroundColor = genColor();
            //col.style.display = 'grid'; 
            //if rowname isn't "normal" then recast this to the correct type
            row.appendChild(col);
        }
        e.appendChild(row);
    }
}

function genDivsGrid(cols) {
    var e = document.getElementById("target");
    var rows = 4;
    const col_lbl = cols +1; 
    console.log(col_lbl)
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var cell = document.createElement('div'); 
            //name each cell so normal, extras get 
            cell.className = "grid-cell row-" + r.toString() + ' col-' + c.toString();
            
            cell.style.backgroundColor = genColor();
            cell.innerHTML = r+c;
            if (c==0) {
                cell.id = 'lbl-' + r.toString();
                cell.style.backgroundColor = 'white';
                cell.innerHTML = 'label this';
            }
            e.appendChild(cell);
        }
    }
    //style table
    e.style.display = 'grid';
    e.style.gridTemplateColumns = '100px' + ' auto'.repeat(cols);
    e.style.gridTemplateRows = '250px 100px 100px 100px';
    e.style.gap = '10px';
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
    var normblocks = document.getElementById("normal").childNodes;
    
    for (var c=1; c<normblocks.length; c++) {
        normblocks[c].style.backgroundColor = genColor();
    }

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