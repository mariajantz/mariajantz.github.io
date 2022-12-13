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
            cwidth = Math.floor((fullwd-100)/cols-2*(cols+1)); 
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
    //get all the existing divs in target - normal, then update the colors (for now use random colors)
    var clrblocks = document.getElementsByClassName("normal").childNodes;
    for (var c=0; c<clrblocks.length; c++) {
        console.log(clrblocks[c]);
        clrblocks[c].style.backgroundColor = genColor();
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