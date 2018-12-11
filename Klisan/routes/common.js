const config = require('../config');
const Auth = require("../models/auth.js");

//const nShow = 8; // for pagination

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

module.exports = {
    search: function (searchStr, objects) {
        let found = [];
        searchStr = searchStr.toLowerCase();
        for(let object of objects) {            
            if(~object.title.toLowerCase().indexOf(searchStr)) {
                found.push(object);
            }
        }
        return found;
    },
    pagination: (objects, pageNumber, nShow) => {
        if(isNaN(pageNumber)) 
            pageNumber = 1;        
        return objects.slice(nShow*pageNumber-nShow, nShow*pageNumber);
    },
    getMaxPage: (objects, nShow) => {        
        const nObj = objects.length;
        return nObj ? Math.ceil(nObj/nShow) : 0;  
    },
    uploadImage: (imageBuffer, callback) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image' }, callback)
            .end(imageBuffer);
    },
    parseVideoLink: (link) => {
    /* 
        we need parse 3 types of links:
        1) https://youtu.be/someId
        2) https://www.youtube.com/watch?v=someId
        3) someId  
    */
        const first  = link.indexOf("be/");
        const second = link.indexOf("?v=");
        if(~first) {
            link = link.slice(first + 3); // 3 - length of "be/"
        } else if(~second) {
            link = link.slice(second + 3); // 3 - length of "?v="
        } 
        return link; // if our cases didn't work, we return link like id
    },
    checkSerialBody: (body) => { // if body is cool, return true
        return body.title && body.description && !isNaN(body.mark) && !isNaN(body.seasonsNum);
    },
    checkepisodBody: (body) => { // if body is cool, return true
        return body.title && body.description && body.videoLink && !isNaN(body.mark) && !isNaN(body.seasonNumber) && !isNaN(body.episodNumber);
    },
    cloudinary: cloudinary
}