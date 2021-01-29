const poolAsyncAwait = require('./config/mysqlConfig.js').getMysqlPool2
const logger = require("../util/logger.js")("ranking.js")
const { USER_TABLE } = require('./user')
const RankSchema = require('../models/ranking')

const getGlobalRank = async (req, res) => {
    try {
        const rankType = req.query.rankType
        const offset = req.query.offset
        const limit = req.query.limit
        const [count, rawRankData] = RankSchema.getCountAndRankDataWithScores(rankType, offset, limit)
        const rankData = await buildRankData(rawRankData)
        const returnResult = {rc: 200, rcmsg: "success", count: count, rankData: rankData}
        res.status(200).json(returnResult)
    } catch(e) {
        logger.error(e.message)
        const returnResult = { rc: 500, rcmsg: e.message }
        res.status(500).json(returnResult)
    }
}

const getUserRank = async (req, res) => {
    try {
        const rankType = req.query.rankType
        const targetUserId = req.params.id
        logger.info(`Fetching ${rankType} rank of user ${targetUserId} from redis...`)
        const [rank. score] = RankSchema.getUserRankAndScore(rankType, targetUserId)
        const { userId, displayName, profileImg } = await getUserInfo(targetUserId)
        const userRankData = {userId: userId, displayName: displayName, profileImg: profileImg,
        rank: rank, score: score}
        const returnResult = {rc: 200, rcmsg: "success", userRankData: userRankData}
        res.status(200).json(returnResult)
    } catch(e) {
        logger.error(e.message)
        const returnResult = { rc: 500, rcmsg: e.message }
        res.status(500).json(returnResult)
    }
}

const buildRankData = async rawRankData => {
    const userIds = []
    const scores = []
    for (let i=0; i < rawRankData.length / 2; i++) {
        userIds.push(rawRankData[2*i])
        scores.push(rawRankData[2*i + 1])
    }

    const userInfos = await getUserInfos(userIds)

    const rankData = []
    for (let i=0; i < userIds.length; i++) {
        userId = userIds[i]
        score = scores[i]
        userInfo = userInfos[userId]
        userInfo.score = score
        rankData.push(userInfo)
    }
    return rankData
}

const getUserInfo = async userId => {
    const query = `SELECT user_id, display_name, profile_img from ${USER_TABLE} WHERE user_id = ?`
    logger.info(`Fetching user data of user ${userId} from DB...`)
    const [rows, _] = await poolAsyncAwait.promise().query(query, [userId])
    const { user_id, display_name, profile_img } = rows[0]
    const userInfo = { userId: user_id, displayName: display_name, profileImg: profile_img }
    return userInfo
}

const getUserInfos = async userIds => {
    if (userIds.length == 0) return {}
    const query = `SELECT user_id, display_name, profile_img from ${USER_TABLE} WHERE user_id in 
    (` + userIds.map(() => '?') + `)`
    logger.info(`Fetching user data of users ${userIds} from DB...`)
    const [rows, _] = await poolAsyncAwait.promise().query(query, userIds)
    const userInfos = {}
    rows.forEach(row => {
        const { user_id, display_name, profile_img } = row
        userInfos[user_id] = { userId: user_id, displayName: display_name, 
            profileImg: profile_img }
    })
    return userInfos
}

module.exports = {
    getGlobalRank,
    getUserRank
}