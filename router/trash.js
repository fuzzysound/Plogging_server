const express = require('express');
const cors=require('cors');

const TrashInferface = function(config) {
    const router = express.Router();
    router.all('*',cors());

    this.router = router;
    this.mysqlPool = config.mysqlPool;
    this.mysqlPool2 = config.mysqlPool2;
    this.redisClient = config.redisClient;
    this.MongoPool = config.MongoPool;

    // 쓰레기 관련 api 구현
    router.get("/read", (req, res) => this.readTrash(req, res));// read
    router.post("/write", (req, res) => this.writeTrash(req, res)); // create
    return this.router;
};

TrashInferface.prototype.readTrash = async function(req, res) {
    console.log("trash read api !");

    let query = {"meta.user_id": "xowns1234"};
    let options = {sort: {"meta.created_time": -1}}; // 최신순
    let mongoConnection = null;

    try {
        mongoConnection = this.MongoPool.db('test');
        let trash = await mongoConnection.collection('trash').find(query, options).toArray();
        res.send(trash);
    } catch(e) {
        console.log(e);
    } finally {
        mongoConnection=null;
    }
    
}

TrashInferface.prototype.writeTrash = async function(req, res) {
    console.log("trash write api !");

    let trashObj = { };
    trashObj.meta = { };
    trashObj.meta.user_id = "xowns12355554";
    trashObj.meta.create_time = new Date();
    trashObj.meta.trash_img = "http://img/profile.img";
    trashObj.trash_list = [ ];
    trashObj.trash_list[0] = {"trash_type": 0, "pick_count": 2};
    trashObj.trash_list[1] = {"trash_type": 1, "pick_count": 3};

    let mongoConnection = null;
    try {
        mongoConnection = this.MongoPool.db('test');
        await mongoConnection.collection('trash').insertOne(trashObj);
    } catch(e) {
        console.log(e);
    } finally {
        mongoConnection=null;
    }
}

module.exports = TrashInferface;