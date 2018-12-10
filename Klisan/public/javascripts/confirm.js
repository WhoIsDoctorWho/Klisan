$(function () {
    $("#delEp").click(function () {
        const href = "/deleteSeries?id=" + document.getElementById("episod").value;
        document.getElementById("accept").setAttribute("href", href);
    });
});

$(function () {
    $("#delSer").click(function () {
        const href = "/deleteSerial?sId=" + document.getElementById("serial").value;
        document.getElementById("accept").setAttribute("href", href);
    });
});


function confirm() {
    $("#myModal2").modal('show');
};