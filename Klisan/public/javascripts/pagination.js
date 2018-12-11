const Paginator = {
    page: 1,
    maxPage: 1,
    search: "",
    api: "/api/v1/episods",
    entity: "episods",
};

function acts() { 
    const page = Paginator.page, min = 1, max = Paginator.maxPage;
    if(page > max) 
        Paginator.page = max;
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
            const pages = document.getElementById('pages');
            if(pages) 
                pages.text = `${Paginator.page}/${Paginator.maxPage}`;                
            const appEl = document.getElementById(Paginator.entity); 
            if(appEl)
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

function users() {
    Paginator.entity = "users";
    Paginator.api = "/api/v1/users";
    update();
}

function serial() {
    Paginator.entity = "episods"; //serial
    const serial = document.getElementById('serial');
    const sId = serial ? document.getElementById('serial').value : "";
    if(sId.length > 0) 
        Paginator.api = "/api/v1/serials/" + sId + "/episods";
    else 
        Paginator.api = "/api/v1/episods";
    update();
}