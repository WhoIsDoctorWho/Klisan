const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema(
	{
		login: { type: String, required: true },
		password: { type: String, required: true },
		fullname: { type: String, required: true },
		registered: { type: Date, default: Date.now },
		role: { type: Boolean, default: true }, // false - admin, true - user
		avaUrl: { type: String },
		isDisabled: { type: Boolean, default: false },
		watchList: [{ type: Schema.Types.ObjectId, ref: "serial" }]
	}
);

const UserModel = mongoose.model('User', UserSchema);


module.exports = {
	getAll: function () {
		return UserModel.find();
	},
	getById: function (id) {
		return UserModel.findOne({ _id: id });
	},
	getByLogin: function (login) {
		return UserModel.findOne({ login });
	},
	getByLoginAndPassword: function (login, password) {
		return UserModel.findOne({ login, password });
	},
	create: function (newUser) {
		return new UserModel(newUser).save();
	},
	patch: function(body, id) {
        const updObj = {};
        
        if(body.login)      updObj.login	  = body.login;
		if(body.fullname)   updObj.fullname   = body.fullname;
        if(body.role)  		updObj.role 	  = body.role;
        if(body.isDisabled) updObj.isDisabled = body.isDisabled;                                        

        return UserModel.findOneAndUpdate({_id: id}, updObj);
	},
	updAvatar: function(id, url) {
        return UserModel.findOneAndUpdate({_id: id}, {$set: {avaUrl: url}})
    },
	promote: function (id) {
		return UserModel.findOneAndUpdate({ _id: id }, { $set: { role: false } });
	},
	addToWL: function (userId, sId) {
		return UserModel.findOneAndUpdate({ _id: userId }, { $push: { watchList: sId } });
	},
	getWL: function (id) {
		return UserModel.findOne({ _id: id }).populate('serial');
	},
    delete: function(id) {
        return UserModel.findOneAndDelete({_id: id}); 
    },
};