const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const episodSchema = new mongoose.Schema(
	{
        title:        {type: String, required: true},
        seasonNumber: {type: Number},
        episodNumber: {type: Number },
        description:  {type: String},
        mark:		  {type: Number},
		addingDate:   {type: Date, default: Date.now},
        avaUrl: 	  {type: String},
        videoLink:    {type: String},
        serialId:     {type: Schema.Types.ObjectId}
	}
);

const episodModel = mongoose.model('episods', episodSchema);

module.exports = {
    getAll: function() {
        return episodModel.find().sort({title: 1});
    },
    getById: function(id) {
        return episodModel.findOne({_id: id});
    },
    create: function(newEpisod) {
        return new episodModel(newEpisod).save();
    },
    update: function(updepisod, id) {
        return Promise.all([
            episodModel.findOneAndUpdate({_id: id}, { $set: { 
                title: updepisod.title,
                seasonNumber: updepisod.seasonNumber,
                episodNumber: updepisod.episodNumber,                
                mark: updepisod.mark,
                description: updepisod.description,    
                videoLink: updepisod.videoLink,    
        }}), episodModel.findOne({_id: id})]); 
    },
    patch: function(body, id) {
        const updObj = {};
        
        if(body.title)         updObj.title	       = body.title;
        if(body.mark)          updObj.mark         = body.mark;
        if(body.seasonNumber)  updObj.seasonNumber = body.seasonNumber;
        if(body.episodNumber)  updObj.episodNumber = body.episodNumber;
        if(body.description)   updObj.description  = body.description;
        if(body.videoLink)     updObj.videoLink    = body.videoLink;

        return episodModel.findOneAndUpdate({_id: id}, updObj);
    },
    updAvatar: function(id, url) {
        return episodModel.findOneAndUpdate({_id: id}, {$set: {avaUrl: url}})
    },
    delete: function(id) {
        return episodModel.findOneAndDelete({_id: id});
    },
    deleteFromSerial: function(sId) {
        return episodModel.deleteMany({serialId: sId});
    },
    getnewEpisods: function() {
        return episodModel.find().sort({date: -1});
    },
    
};