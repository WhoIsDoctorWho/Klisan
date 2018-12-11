const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SerialSchema = new mongoose.Schema(
	{
        title:       {type: String, required: true},
        seasonsNum:	 {type: Number},
        mark:        {type: Number },
        description: {type: String},        
        avaUrl: 	 {type: String},
        episods:  [ {type: Schema.Types.ObjectId, ref: "episods"} ]
	}
);

const SerialModel = mongoose.model('serial', SerialSchema);

module.exports = {
    getAll: function() {
        return SerialModel.find();
    },
    getById: function(id) {
        return SerialModel.findOne({_id: id}).populate('episods');
    },
    getByIdApi: function(id) {
        return SerialModel.findOne({_id: id});
    },
    create: function(newSerial) {
        return new SerialModel(newSerial).save();
    },
    update: function(updSerial, id) {
        return Promise.all([
            SerialModel.findOneAndUpdate({_id: id}, { $set: { 
                title: updSerial.title,
                seasonsNum: updSerial.seasonsNum,
                mark: updSerial.mark,
                description: updSerial.description,        
        }}), SerialModel.findOne({_id: id}).populate('episods')]);
    },
    patch: function(body, id) {
        const updObj = {};
        
        if(body.title)       updObj.title = body.title;
        if(body.mark)        updObj.mark = body.mark;
        if(body.seasonsNum)  updObj.seasonsNum = body.seasonsNum;
        if(body.description) updObj.description = body.description;                                        

        return SerialModel.findOneAndUpdate({_id: id}, updObj);
    },
    updAvatar: function(id, url) {
        return SerialModel.findOneAndUpdate({_id: id}, {$set: {avaUrl: url}})
    },
    delete: function(id) {
        return SerialModel.findOneAndDelete({_id: id}); 
    },
    addEpisod: function(newEpisod) {
        return SerialModel.findOneAndUpdate({_id: newEpisod.serialId}, {$push: {episods: newEpisod.id}});
    },
    removeEpisod: function(sId, id) {
        return SerialModel.findOneAndUpdate({_id: sId}, {$pull: {episods: id}});
    },
    getArr: function(idArr) {
        return SerialModel.find({'_id': { $in: idArr}});
    }
};