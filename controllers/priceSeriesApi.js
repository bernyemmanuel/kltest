'use strict';

const request = require('request');
const models = require('../models');
const moment = require('moment-timezone');
const async = require('async');

export default class PriceSeriesCtrl {
    constructor() {
        this.model_type_attributes = ['description', 'name', 'symbol'];
        this.apiFnts = {
            WEEKLY: {
                code: 'TIME_SERIES_WEEKLY',
                key: 'Weekly Time Series',
                model: models.asset_price_weekly,
                attributes: ['open', 'high', 'low', 'close', 'volume', 'date']
            },
            DAILY: {
                code: 'TIME_SERIES_DAILY',
                key: 'Time Series (Daily)',
                model: models.asset_price_daily,
                attributes: ['open', 'high', 'low', 'close', 'volume', 'date']
            },
            INTRA: {
                code: 'TIME_SERIES_INTRADAY',
                key: 'Time Series ',
                model: models.asset_price,
                attributes: [
                    'price',
                    'high',
                    'low',
                    'close',
                    'volume',
                    'timestamp'
                ]
            }
        };
        this.BASE_URL = config.urls.alphavantage;
        this.defaults_params = {
            function: this.apiFnts['WEEKLY'].code
        };
        this.apiKey = config.keys.alphavantage;
        this.request_options = {
            method: 'GET',
            url: '',
            qs: '',
            headers: {
                'content-type': 'application/json',
                accept: 'application/json'
            }
        };
        this.asset = null;
    }

    /**
     * identify errors in the params and return errors
     * @param  {Object} query_params parameters are passed
     * @return {Array} errors        error arrays
     */
    __identifyErrors(data) {
        let error = [];
        if (
            !(data.hasOwnProperty('symbol')
                ? data.symbol != ''
                    ? true
                    : false
                : false)
        )
            error.push({
                message: "field 'symbol' missing"
            });
        if (data.hasOwnProperty('type')) {
            if (data.type == '')
                error.push({
                    message: "field 'type' missing"
                });
            else if (!this.apiFnts.hasOwnProperty(data.type))
                error.push({
                    message: "field 'type' not found"
                });
        } else
            error.push({
                message: "field 'type' missing"
            });
        return error;
    }

    /**
     * checking db to get the supplied symbol
     * @param  {String}   symbol   the symbol is supplied as the first argument
     * @param  {Function} callback the callback function
     * @return {error, boolean}    the return will be 2 variables. 1st is error followed by boolean value whether it exist in db or not
     */
    __checkSymbolExist(symbol, callback) {
        models.asset
            .findOne({
                where: {
                    symbol: symbol
                },
                attributes: ['symbol', 'name', 'description', 'id']
            })
            .then(asset => {
                if (asset) {
                    this.asset = asset;
                    callback(null, true);
                } else callback(null, false);
            });
    }

    __isDataUpToDate(type, result) {
        let timezone = 'America/New_York';
        let current_time = moment(new Date()).utc(),
            est_time = moment.tz(timezone).set({ seconds: 0, milliseconds: 0 }),
            start_time = moment
                .tz(timezone)
                .set({ hours: 9, minutes: 30, seconds: 0, milliseconds: 0 }), //moment('09:30 am', 'HH:mm a'),
            end_time = moment
                .tz(timezone)
                .set({ hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }), //moment('04:00 pm', 'HH:mm a'),
            is_current_time_in_business_hrs = est_time.isBetween(
                start_time,
                end_time
            ),
            row_last_updated = moment
                .tz(result.updated_at, timezone)
                .set({ seconds: 0, milliseconds: 0 });
        // if (!is_current_time_in_business_hrs) {
        //     // if not in business hours, then subsctract the day by 1 to get the previous days data
        //     current_time = current_time.subtract(1, 'd');
        // }
        // console.log(`\n Details \n est_time : ${est_time.format()} \n st_time: ${start_time.format()} \n en_time: ${end_time.format()} \n cur_time : ${current_time.format()} \n last_update_time : ${row_last_updated}`);
        let getLastFriday = () => {
            let dayOfWeek = 5; //friday
            let date = new Date();
            date.setDate(
                date.getDate() + ((dayOfWeek - 7 - date.getDay()) % 7)
            );
            return date;
        };
        // console.log(
        //   `lastFriday -${moment(getLastFriday())
        //     .utc()
        //     .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        //     .format()}`
        //   );
        // console.log(` ${current_time} > ${row_last_updated} = ${current_time > row_last_updated}`);
        if (type == 'DAILY') {
            current_time.set({ hours: 0, minutes: 0 });
            if (is_current_time_in_business_hrs) {
                current_time = est_time.set({ hours: 0, minutes: 0 });
                row_last_updated = row_last_updated.set({
                    hours: 0,
                    minutes: 0
                });
                return row_last_updated >= current_time;
            } else {
                let yesterday_morning = moment.tz(timezone).set({
                    hours: 9,
                    minutes: 30,
                    seconds: 0,
                    milliseconds: 0
                });
                yesterday_morning.subtract(1, 'd');
                return row_last_updated >= yesterday_morning;
            }
        } else if (type == 'WEEKLY') {
            current_time = est_time.set({ hours: 0, minutes: 0 });
            // console.log(`\n Details \n est_time : ${est_time.format()} \n cur_time : ${current_time.format()} \n last_update_time : ${row_last_updated.format()}`);
            if (current_time > row_last_updated) {
                // check if the last update is on a friday
                let last_friday = moment
                    .tz(getLastFriday(), timezone)
                    .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
                row_last_updated = row_last_updated.set({
                    hours: 0,
                    minutes: 0
                });
                if (+last_friday == +row_last_updated) return true;
                else return false;
            } else return true;
        } else if (type == 'INTRA') {
            current_time = est_time.set({ seconds: 0, milliseconds: 0 });
            //need to check if current_time - 30min is in between last row update time
            if (is_current_time_in_business_hrs) {
                let current_time = moment()
                        .tz(timezone)
                        .set({ seconds: 0, milliseconds: 0 }),
                    before_time = moment()
                        .tz(timezone)
                        .set({ seconds: 0, milliseconds: 0 })
                        .subtract(30, 'minutes');
                return row_last_updated.isBetween(before_time, current_time);
            } else return true;
        }
    }

    /**
     * check the db to see if the data exist and is the latest
     * @param  {Object}   data     [description]
     * @param  {Function} callback [description]
     */
    __checkIfDataExist(data, callback) {
        let fnt = this.apiFnts[data.type],
            model = fnt.model,
            asset_id = this.asset.id;
        model
            .findOne({
                where: {
                    asset_id: asset_id
                }
            })
            .then(row => {
                if (row) {
                    // if (this.__isDataUpToDate(data.type, row)) {
                    callback(null, true, {
                        // status: 'SUCCESS',
                        // data: {
                        symbol: this.asset.symbol,
                        info: this.asset.description,
                        chart_data:
                            typeof row.close_price == 'string'
                                ? JSON.parse(row.close_price)
                                : row.close_price
                        // }
                    });
                    // } else callback(null, false, []);
                } else callback(null, false, []);
            });
    }

    __convertRawDataToStructured(info, data) {
        if (data.hasOwnProperty('Meta Data')) {
            if (!data['Meta Data'].hasOwnProperty('2. Symbol'))
                return {
                    status: 'FAILED',
                    message: 'Please try after sometime'
                };
        } else
            return {
                status: 'FAILED',
                message: 'Please try after sometime'
            };
        let keys = {};
        Object.keys(this.apiFnts).map(k => {
            keys[k] = this.apiFnts[k].key;
        });
        let restrict_date_to, restrict_number;
        let __date = new Date();
        switch (info.type) {
            case 'INTRA':
                keys['INTRA'] =
                    keys['INTRA'] +
                    '(' +
                    data['Meta Data']['4. Interval'] +
                    ')';
                restrict_number = 30;
                break;
            case 'WEEKLY':
                // restrict 5yrs
                __date.setFullYear(__date.getFullYear() - 5);
                restrict_date_to = new Date(__date);
                break;
            case 'DAILY':
                // restrict 3months
                __date.setMonth(__date.getMonth() - 3);
                restrict_date_to = new Date(__date);
                break;
        }
        let _key_value = keys[info.type];
        // console.log(`------------ _key_value: ${_key_value}, keys ${JSON.stringify(keys)}, data: ${JSON.stringify(Object.keys(data[_key_value.toString()]))}`);
        let responseData = {
            symbol: data['Meta Data']['2. Symbol'],
            info: data['Meta Data']['1. Information'],
            chart_data: {}
        };
        // Object.keys(data[_key_value.toString()]).some(date => {
        //     let values = data[_key_value.toString()][date];
        //     if (restrict_date_to !== '') {
        //         let curD = new Date(date);
        //         if (+curD >= +restrict_date_to) {
        //             responseData.chart_data[date] = new ChartData(values);
        //             return false;
        //         } else {
        //             return true;
        //         }
        //     } else {
        //         responseData.chart_data[date] = new ChartData(values);
        //         return false;
        //     }
        // });
        let count = 0;
        Object.keys(data[_key_value.toString()]).some(date => {
            let values = data[_key_value.toString()][date];
            if (info.type == 'INTRA') {
                count++;
                if (count <= restrict_number) {
                    responseData.chart_data[date] = new ChartData(values);
                    return false;
                } else return true;
            } else {
                if (restrict_date_to !== '') {
                    let curD = new Date(date);
                    if (+curD >= +restrict_date_to) {
                        responseData.chart_data[date] = new ChartData(values);
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    responseData.chart_data[date] = new ChartData(values);
                    return false;
                }
            }
        });
        return {
            status: 'SUCCESS',
            data: responseData
        };
    }

    /**
     * add the provided result to the corresponding table
     */
    __createOrUpdateDb(data, result, callback) {
        let fnt = this.apiFnts[data.type],
            model = fnt.model,
            asset_id = this.asset.id,
            output = this.__convertRawDataToStructured(data, result);
        if (output.status == 'SUCCESS') {
            let chart_data = output.data.chart_data;
            // if (data.type != 'INTRA') {
            model
                .upsert({
                    asset_id: asset_id,
                    close_price: JSON.stringify(chart_data)
                })
                .then(values => {
                    console.log(`${data.type} table created|updated`);
                });
            // }
            callback(false, output.data);
        } else {
            callback(output, null);
        }
    }

    /**
     * make the Alphavantage api url from the given input
     * @param  {Object} data consist of the type, symbol and interval (if type is INTRA)
     * @return {String}      url is return
     */
    __makeUrl(data) {
        let _filter = {
            symbol: data.symbol,
            function: this.apiFnts[data.type].code
        };
        // data['interval']
        if (data.type == 'INTRA') {
            _filter['interval'] = '30min';
        }
        let defaults = this.defaults_params;
        let settings = Object.assign({}, defaults, _filter);
        settings['apikey'] = this.apiKey;
        let _url_parts = [];
        Object.keys(settings).map(e => {
            _url_parts.push(e + '=' + settings[e]);
        });
        let url = `${this.BASE_URL}/query?${_url_parts.join('&')}`;
        console.log(`Alphavantage url ${url}`);
        return url;
    }

    __callAlphaVantageApi(data, callback) {
        let url = this.__makeUrl(data);
        let options = Object.assign({}, this.request_options, {
            url: url,
            method: 'GET'
        });
        let self = this;
        request(options, (error, response, body) => {
            let ex = JSON.parse(body);
            if (!error && body && !ex.hasOwnProperty('Error Message')) {
                self.__createOrUpdateDb(data, JSON.parse(body), callback);
            } else callback(error);
        });
    }

    getData(req, res) {
        let data = req.body;
        let query_params = req.params;
        if (query_params['symbol'] && query_params['symbol'] != '')
            data['symbol'] = query_params['symbol'].toUpperCase();
        let error = this.__identifyErrors(data);
        if (error.length == 0) {
            let functions = [
                callback => {
                    this.__checkSymbolExist(data.symbol, callback);
                },
                (exist, callback) => {
                    if (!exist) callback({ message: 'Symbol not found in db' });
                    else this.__checkIfDataExist(data, callback);
                },
                (exist, result, callback) => {
                    console.log('exist : ', exist);
                    // callAlphaVantageApi
                    if (!exist) {
                        this.__callAlphaVantageApi(data, callback);
                    } else {
                        // if (data.type == 'INTRA') {
                        //     this.__callAlphaVantageApi(data, callback);
                        // } else
                        callback(null, result);
                    }
                }
            ];
            async.waterfall(functions, (err, result) => {
                if (err)
                    sendResponse(res, 'custom', { code: 400, message: err });
                else {
                    // result.chart_data = JSON.parse(result.chart_data)
                    sendResponse(res, null, result);
                }
            });
        } else sendResponse(res, 'custom', { code: 400, message: error });
    }
}

class ChartData {
    constructor(obj) {
        // this.open = obj['1. open'] || '';
        // this.high = obj['2. high'] || '';
        // this.low = obj['3. low'] || '';
        this.close = obj['4. close'] || '';
        // this.volume = obj['5. volume'] || '';
    }
}
