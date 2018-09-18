// admin.js - Admin route module.

/*
  One time code:

  Generate 100, 6 digit alpha numeric codes that will be sent to users
  Every time this code is used, mark it as deleted from the database so it can't be reused
  Multiple use code:

  Generate 20, 6-digit alpha numeric code that starts with PR-xxxxxx
  End date
  Counter
  This code will be decremented as used until it reaches zero.
  PS: KP (promotions) and KU (referral) are for future.
 */

var express = require('express');
var router = express.Router();
const moment = require('moment-timezone');
import jwt from 'jsonwebtoken';

const models = require('../models');
import CodeController from '../controllers/inviteCodeApi';
import PriceSeriesCtrl from '../controllers/priceSeriesApi';

const CodeCtrl = new CodeController();
const PriceCtrl = new PriceSeriesCtrl();

router.use((req, res, next) => {
    const accessToken = req.headers.access_token;
    if (accessToken !== 'pzsvt1fax9e-fzczwp2rqdg') {
        sendResponse(res, 'invalid_access_token');
    } else next();
});

/**
 * @swagger
 * /admin:
 *   get:
 *     tags:
 *       - admin
 *     description: Checking whether the server is alive or not
 *     produces:
 *       - application/string
 *     responses:
 *       200:
 *         description: Connection established or not
 */
router.get('/', function(req, res) {
    models.sequelize
        .authenticate()
        .then(() => {
            res.send('Connection has been established successfully.');
        })
        .catch(err => {
            res.send({
                message: 'Unable to connect to the database:',
                err
            });
        });
});

router.post('/code/generate', function(req, res) {
    /*
    {
      "type": "string",
      "prefix": "string",
      "count": "number",
      "use_count": "number", // default 1
      "end_date": "date|boolean" // default false, format: 'mm-dd-yyyy'
    }
   */
    CodeCtrl.generate(req, res);
});

router.post('/code/retrieve', (req, res) => {
    /*
    {
      "filter": "valid_codes | expired_codes | used_codes",
      "type": "CODE_TYPE_PREFIX", // optional
    }
   */
    CodeCtrl.retrieve(req, res);
});

router.get('/checking', (req, res) => {
    let timezone = 'America/New_York',
        current_time = moment(new Date()).tz(timezone),
        start_time = moment()
            .tz(timezone)
            .set({ hours: 9, minutes: 30, seconds: 0, milliseconds: 0 }), //moment('09:30 am', 'HH:mm a').tz('America/New_York'),
        end_time = moment()
            .tz(timezone)
            .set({ hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }), //moment('04:00 pm', 'HH:mm a').tz('America/New_York'),
        is_current_time_in_business_hrs = current_time.isBetween(
            start_time,
            end_time
        );
    console.log(`current_time ${current_time}`);
    res.send({
        in_time: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        ny_time: current_time,
        st_time: start_time,
        en_time: end_time,
        timezon: moment.tz.guess(),
        busines: is_current_time_in_business_hrs
    });
    // let input = req.body;
    // PriceCtrl.checkAssetData(input).then(result => {
    // });
});

router.get('/accesstoken/:uid', (req, res) => {
    let uid = req.params.uid;
    const accessToken = jwt.sign({ uid }, process.env.JWT_KEY, {
        expiresIn: '60d'
    });
    res.send({ accessToken });
});

module.exports = router;
