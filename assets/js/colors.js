var num_divs = document.getElementById('num_clrs').value

genDivs(num_divs, 'normal')
genDivs(num_divs, 'deut')

function genDivs(cols, rowname){
    var e = document.getElementById("target");
    var rows = 1
    for (var r = 0; r < rows; r++) {
        var row = document.createElement("div");
        row.className = rowname;
        //before starting, make a div with a label
        var lbl = document.createElement("div");
        lbl.className = "columns lbl";
        lbl.innerHTML = rowname;
        lbl.style.width = '10%';
        for (var c = 0; c < cols; c++) {
            var col = document.createElement("div");
            let tmp = c+1;
            col.className = "columns project-" + tmp.toString();
            //col.innerHTML = (r * rows) + c;
            //CSS changes: 
            //change width of these boxes to fill the space
            cwidth = 100/cols - 10;
            col.style.width = cwidth.toString() + '%';
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
    //get all the existing divs in target, then update the colors (for now use random colors)
}

function restoreDefaultValues() {
    var nc = document.getElementById("num_clrs");
    nc.value = 4; 
    document.getElementById("max_bright").value = 80;
}