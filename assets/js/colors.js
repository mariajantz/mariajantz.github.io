genDivs(4)

function genDivs(cols){
    var e = document.getElementById("target");
    var rows = 1
    for (var r = 0; r < rows; r++) {
        var row = document.createElement("div");
        row.className = "columns";
        for (var c = 0; c < cols; c++) {
            var col = document.createElement("div");
            col.className = "col";
            col.innerHTML = (r * rows) + c;
            col.innerHTML = "A";
            row.appendChild(col);
        }
        e.appendChild(row);
    }
}