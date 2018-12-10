const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const seriesSchema = new mongoose.Schema(
	{
        title:        {type: String, required: true},
        seasonNumber: {type: Number},
        seriesNumber: {type: Number },
        description:  {type: String},
        mark:		  {type: Number},
		addingDate:   {type: Date, default: Date.now},
        avaUrl: 	  {type: String},
        videoLink:    {type: String},
        serialId:     {type: Schema.Types.ObjectId}
	}
);

const SeriesModel = mongoose.model('serieses', seriesSchema);

module.exports = {
    getAll: function() {
        return SeriesModel.find().sort({title: 1});
    },
    getById: function(id) {
        return SeriesModel.findOne({_id: id});
    },
    create: function(newSeries) {
        return new SeriesModel(newSeries).save();
    },
    update: function(updSeries, id) {
        return Promise.all([
            SeriesModel.findOneAndUpdate({_id: id}, { $set: { 
                title: updSeries.title,
                seasonNumber: updSeries.seasonNumber,
                seriesNumber: updSeries.seriesNumber,                
                mark: updSeries.mark,
                description: updSeries.description,    
                videoLink: updSeries.videoLink,    
        }}), SeriesModel.findOne({_id: id})]); 
    },
    patch: function(body, id) {
        const updObj = {};
        
        if(body.title)         updObj.title	       = body.title;
        if(body.mark)          updObj.mark         = body.mark;
        if(body.seasonNumber)  updObj.seasonNumber = body.seasonNumber;
        if(body.seriesNumber)  updObj.seriesNumber = body.seriesNumber;
        if(body.description)   updObj.description  = body.description;
        if(body.videoLink)     updObj.videoLink    = body.videoLink;

        return SeriesModel.findOneAndUpdate({_id: id}, updObj);
    },
    updAvatar: function(id, url) {
        return SeriesModel.findOneAndUpdate({_id: id}, {$set: {avaUrl: url}})
    },
    delete: function(id) {
        return SeriesModel.findOneAndDelete({_id: id});
    },
    deleteFromSerial: function(sId) {
        return SeriesModel.deleteMany({serialId: sId});
    },
    getNewSerieses: function() {
        return SeriesModel.find().sort({date: -1});
    },
    
};