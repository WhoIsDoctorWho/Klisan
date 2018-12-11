$(function () {
    $("#delEp").click(function () {
        const href = "/deleteepisod?id=" + document.getElementById("episod").value;
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

function goBack() {
    window.history.back();
}