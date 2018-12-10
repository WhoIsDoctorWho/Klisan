const Paginator = {
    page: 1,
    maxPage: 1,
    search: "",
    api: "/api/v1/serieses",
    entity: "serieses",
};

function acts() { 
    const page = Paginator.page, min = 1, max = Paginator.maxPage;
    if(page > max) 
        page = max;
    if(page === min) {
        $("#prev").addClass("disabled");
    } else {
        $("#prev").removeClass("disabled");                        
    }
    if (page === max) {
        $("#next").addClass("disabled");
    } else {
        $("#next").removeClass("disabled");                        
    }
    if(page != max && page != min) {
        $("#prev").removeClass("disabled");
        $("#next").removeClass("disabled");
    }

};

function update() {
    let request = Paginator.api + "?page=" + Paginator.page;
    if(Paginator.search.length > 0)
        request += "&search=" + Paginator.search; 
    Promise.all([
        fetch("/templates/" + Paginator.entity + ".mst").then(x => x.text()),
        fetch(request).then(x => x.json()),
    ])
        .then(([templateStr, itemsData]) => {                            
            const dataObject = {items: itemsData.items};
            Paginator.maxPage = itemsData.max;
            acts();
            const renderedHtmlStr = Mustache.render(templateStr, dataObject);
            return renderedHtmlStr;
        })
        .then(htmlStr => {        
            document.getElementById('pages').text = `${Paginator.page}/${Paginator.maxPage}`;                
            const appEl = document.getElementById(Paginator.entity); 
            appEl.innerHTML = htmlStr;
        })
        .catch(err => console.log(err));
}

function nextPage() {  
    if(Paginator.maxPage > Paginator.page) 
        Paginator.page++;     
    update();
}

function prevPage() {
    if(Paginator.page > 1)
        Paginator.page--;
    update();
}

function find() { 
    Paginator.search = document.getElementById("search").value;
    update();
} 

function serials() {
    Paginator.entity = "serials";
    Paginator.api = "/api/v1/serials";
    update();
}

function serial() {
    Paginator.entity = "serieses"; //serial
    const serial = document.getElementById('serial');
    const sId = serial ? document.getElementById('serial').value : "";
    if(sId.length > 0) 
        Paginator.api = "/api/v1/serials/" + sId + "/serieses";
    else 
        Paginator.api = "/api/v1/serieses";
    update();
}

function display() { /* @todo hide pagination when scrolled */
    //$("#bottom").addClass("invisible");    
}

/* $(document).ready(function() {
    $('article').readmore({
        collapsedHeight: 100,
        speed: 350,
        moreLink: '<a href="#">More</a>',
        lessLink: '<a href="#">Less</a>',            
    })
}); */