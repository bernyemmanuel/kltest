import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import fs from 'fs';
import promise from 'bluebird';
import jwt from 'jsonwebtoken';
import path from 'path';
import morgan from 'morgan';
var apiRouter = express.Router();

const loginApiCtrl = require('../controllers/loginApi');
const userDetailsCtrl = require('../controllers/userDetailsApi');
const fileUploadCtrl = require('../controllers/uploadFile');
const assetsCtrl = require('../controllers/assetsApi');
const userAssetCtrl = require('../controllers/userAssetApi');
const transactionCtrl = require('../controllers/transactionApi');
const promoReferCtrl = require('../controllers/promoAndReferalApi');
const marketDataCtrl = require('../controllers/marketDataApi');
const userDocumentsCtrl = require('../controllers/userDocumentsApi');
const supportCtrl = require('../controllers/supportApi');
const versionCtrl = require('../controllers/versionApi');
const brokerageAccountCtrl = require('../controllers/brokerageAccountApi');

import PriceSeriesCtrl from '../controllers/priceSeriesApi';
import CodeController from '../controllers/inviteCodeApi';
import CurrencyCtrl from '../controllers/currencyApi';
import AddressCtrl from '../controllers/addressApi';
const avCtrl = new PriceSeriesCtrl();
const codeCtrl = new CodeController();
const currencyCtrl = new CurrencyCtrl();
const addressCtrl = new AddressCtrl();

apiRouter.get('/version', versionCtrl.getVersion);
apiRouter.post('/login', loginApiCtrl.loginRequest);
apiRouter.post('/loginVerify', loginApiCtrl.loginVerify);

// login will not have access token hence, should be define above middleware for apiroutes.
apiRouter.use((req, res, next) => {
    const accessToken = req.headers.access_token;
    const uid = req.headers.uid;
    jwt.verify(accessToken, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            // console.log("access token", err);
            console.log(
                `invalid access token, uid ${req.headers.uid} and token as ${
                    req.headers.access_token
                }`
            );
            sendResponse(res, 'invalid_access_token');
        } else if (parseInt(uid, 10) !== parseInt(decoded.uid, 10)) {
            console.log(
                `access token UID and UID missmatch, req uid ${
                    req.headers.uid
                } and token as ${req.headers.access_token}. UID in token is ${
                    decoded.uid
                }`
            );
            sendResponse(res, 'invalid_access_token');
        } else {
            next();
        }
    });
});

/**
 * @swagger
 * definition:
 *   common_header:
 *     properties:
 *       uid:
 *         type: string
 *       access_token:
 *         type: string
 *   user_update_details:
 *     properties:
 *       first_name:
 *         type: string
 *       last_name:
 *         type: string
 *       dw_user_id:
 *         type: string
 *       dw_account_d:
 *         type: string
 *   users_get_details:
 *     properties:
 *       mobile_number:
 *         type: string
 *       email_id:
 *         type: string
 *       status:
 *         type: string
 *       first_name:
 *         type: string
 *       last_name:
 *         type: string
 *       dw_user_id:
 *         type: string
 *       dw_account_d:
 *         type: string
 *   user_support:
 *      properties:
 *        type:
 *          type: string
 *        message:
 *          type: string
 *   asset_details:
 *      properties:
 *        asset_id:
 *          type: number
 *        asset_name:
 *          type: string
 *        symbol:
 *          type: string
 *        open:
 *          type: number
 *        high:
 *          type: number
 *        low:
 *          type: number
 *        close:
 *          type: number
 *        volume:
 *          type: number
 *        description:
 *          type: string
 *        perc_change:
 *          type: number
 *        price_diff:
 *          type: number
 *        asset_category_id:
 *          type: string
 *        asset_followed:
 *          type: boolean
 */

apiRouter.get('/getStockPrice', marketDataCtrl.getStockPrice);

/**
 * @swagger
 * /api/assets:
 *   get:
 *     tags:
 *       - assets
 *     description: gets the all users assets
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Asset Details
 *         schema:
 *           $ref: '#/definitions/asset_details'
 */
apiRouter.get('/assets', assetsCtrl.listAll);

/**
 * @swagger
 * /api/assets/trending:
 *   get:
 *     tags:
 *       - assets
 *     description: gets the trending
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Asset Details
 *         schema:
 *           $ref: '#/definitions/asset_details'
 */
apiRouter.get('/assets/trending', assetsCtrl.listTrending);

/**
 * @swagger
 * /api/assets/watchlist:
 *   get:
 *     tags:
 *       - assets
 *     description: gets the trending
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Asset Details
 *         schema:
 *           $ref: '#/definitions/asset_details'
 */
apiRouter.get('/assets/watchlist', assetsCtrl.listWatchlist);

apiRouter.get('/asset/listAssets', assetsCtrl.listAssets);

/**
 * @swagger
 * /api/asset/{symbol}/detail:
 *   get:
 *     tags:
 *       - assets
 *     description: get the asset details with symbol
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *       - name: symbol
 *         description: assets's symbol
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Asset Details
 *         schema:
 *           $ref: '#/definitions/asset_details'
 */
apiRouter.get('/asset/:symbol/detail', assetsCtrl.getAssetDetail);

apiRouter.post('/asset/followAsset', assetsCtrl.followAsset);
apiRouter.post('/asset/unFollowAsset', assetsCtrl.unFollowAsset);
apiRouter.get('/asset/price', assetsCtrl.getPricesFromBulkSymbols);

apiRouter.post('/assets/:symbol/priceSeries', (req, res) => {
    avCtrl.getData(req, res);
});
apiRouter.post('/assets/check', (req, res) => {
    avCtrl.checkIfDataExist(req.body).then(response => {
        res.send(response);
    });
});

apiRouter.get('/country/list', (req, res) => {
    addressCtrl.getAllCountries(req, res);
});
apiRouter.get('/:country_id/state/list', (req, res) => {
    addressCtrl.getStates(req, res);
});

/**
 * @swagger
 * /api/currency/convert/{from}/{to}:
 *   get:
 *     tags:
 *       - currency
 *     description: get the asset details with symbol
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: from
 *         description: from currency value eg. USD
 *         in: path
 *         required: true
 *         type: string
 *       - name: to
 *         description: to currency value eg. INR
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: From to value
 */
apiRouter.get('/currency/convert/:from/:to', (req, res) => {
    currencyCtrl.convert(req, res);
});

apiRouter.get('/code/apply/:key', (req, res) => {
    codeCtrl.validate(req, res);
});

apiRouter.post('/uploadImage', fileUploadCtrl.uploadFile);
apiRouter.post('/user', userDetailsCtrl.updateUser);
apiRouter.get('/user/watchList', userAssetCtrl.getWatchList);

apiRouter.get('/user/add/waitlist', userDetailsCtrl.addToWaitlist);

/**
 * @swagger
 * /api/user/getMyDetails:
 *   get:
 *     tags:
 *       - user
 *     description: gets the user details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: header
 *         description: common header params
 *         in: header
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Users Data
 *         schema:
 *           $ref: '#/definitions/users_get_details'
 */
apiRouter.get('/user/getMyDetails', userDetailsCtrl.getDetails);

/**
 * @swagger
 * /api/user/updateMyDetails:
 *   post:
 *     tags:
 *       - user
 *     description: Updates the user details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: passed via request body. Only pass the fields to be updated. DO NOT PASS NULL VALUES
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/user_update_details'
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
apiRouter.post('/user/updateMyDetails', userDetailsCtrl.updateDetails);

apiRouter.post('/user/passcode', userDetailsCtrl.setPasscode);
apiRouter.post('/user/resetPasscode', userDetailsCtrl.resetPasscode);
apiRouter.get('/user/getDocuments', userDocumentsCtrl.getMyDocuments);
apiRouter.get('/user/getMyAssets', userAssetCtrl.getMyAssets);

/**
 * @swagger
 * /api/user/help:
 *   post:
 *     tags:
 *       - user
 *     description: Updates the user details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: passed via request body.
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/user_support'
 *       - name: header
 *         description: common header params
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/common_header'
 *     responses:
 *       200:
 *         description: Successfully updated
 */
apiRouter.post('/user/help', supportCtrl.supportMessage);
apiRouter.post('/transaction/buyAsset', transactionCtrl.buyAsset);
apiRouter.post('/transaction/sellAsset', transactionCtrl.sellAsset);
apiRouter.get(
    '/transaction/getMyTransactions',
    transactionCtrl.getTransactions
);

apiRouter.post('/code/redeem', promoReferCtrl.redeemCode);
apiRouter.get('/code/getUserCode', promoReferCtrl.getUserCoupons);
apiRouter.post(
    '/drivewealth/checkUsername',
    brokerageAccountCtrl.checkUsername
);
apiRouter.post(
    '/drivewealth/createAccount',
    brokerageAccountCtrl.createAccount
);
apiRouter.post('/drivewealth/login', brokerageAccountCtrl.login);

module.exports = apiRouter;
