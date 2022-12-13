var num_divs = document.getElementById('num_clrs').value

genDivs(num_divs, 'normal')
genDivs(num_divs, 'deut')

function genDivs(cols, rowname){
    var e = document.getElementById("target");
    var rows = 1
    for (var r = 0; r < rows; r++) {
        var row = document.createElement("div");
        row.className = rowname;
        for (var c = 0; c < cols; c++) {
            var col = document.createElement("div");
            let tmp = c+1;
            col.className = "columns project-" + tmp.toString();
            //col.innerHTML = (r * rows) + c;
            //CSS changes: 
            //
            //then put a color here
            row.appendChild(col);
        }
        e.appendChild(row);
    }
}

function genColor(){
    // for now just random color

}