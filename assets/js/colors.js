var num_divs = document.getElementById('num_clrs').value

genDivs(num_divs, 'normal', 'normal')
genDivs(num_divs, 'colorblind', 'deuteranopia')
genDivs(num_divs, 'colorblind', 'protanopia')
genDivs(num_divs, 'colorblind', 'tritanopia')

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
            //if rowname isn't "normal" then recast this to the correct type
            row.appendChild(col);
        }
        e.appendChild(row);
    }
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