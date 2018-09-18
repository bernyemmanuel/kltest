'use strict';
const models = require('../models');
const moment = require('moment');

export default class CodeController {
    constructor() {
        this.CodeModel = models.code;
        this.CodeTypeModel = models.code_type;
        this.defaults = {
            type: '',
            prefix: '',
            count: 1,
            use_count: 1, // default 1
            end_date: false // default false, format: 'dd-mm-yyyy'
        };
    }

    createCodeType(data) {
        return new Promise((resolve, reject) => {
            this.CodeTypeModel.findOrCreate({
                where: {
                    prefix: data.prefix
                },
                defaults: {
                    name: data.name,
                    prefix: data.prefix
                }
            }).spread((codeType, created) => {
                resolve(codeType, created);
            });
        });
    }

    generateCode() {
        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    }

    createCodes(data) {
        if (data.hasOwnProperty('end_date')) {
            let test = new Date(data['end_date']);
            let today = new Date();
            if (test == 'Invalid Date')
                return Promise.resolve({
                    error: 'INVALID',
                    message: 'Invalid date format. Use mm-dd-yyyy format'
                });
            else if (+test <= +today)
                return Promise.resolve({
                    error: 'INVALID',
                    message:
                        'Invalid date. Use future date. Use mm-dd-yyyy format'
                });
        }
        if (!data.hasOwnProperty('use_count')) data['use_count'] = 1;
        return this.createCodeType({
            name: data.type,
            prefix: data.prefix
        }).then((type, isNew) => {
            if (data.count > 1) {
                let codes = [];
                for (var i = 0; i < data.count; i++) {
                    codes.push({
                        key: this.generateCode(),
                        use_count: data.use_count,
                        code_type_id: type.dataValues.id,
                        end_date: data['end_date']
                            ? Date.parse(data['end_date'])
                            : 'false'
                    });
                }
                return this.CodeModel.bulkCreate(codes).then(() => {
                    return Promise.resolve(codes);
                });
            } else {
                return this.CodeModel.create({
                    key: this.generateCode(),
                    use_count: data.use_count,
                    code_type_id: type.dataValues.id,
                    end_date: data['end_date']
                        ? Date.parse(data['end_date'])
                        : 'false'
                }).then(code => {
                    return Promise.resolve(code);
                });
            }
        });
    }

    generate(req, res) {
        let options = Object.assign({}, this.defaults, req.body);
        this.createCodes(options).then(result => {
            if (result.hasOwnProperty('error')) {
                res.send(result);
            } else {
                let id = 0;
                if (Array.isArray(result)) id = result[0].code_type_id;
                else id = result.code_type_id;
                this.CodeTypeModel.findById(id).then(code_type => {
                    let output = [];
                    if (Array.isArray(result)) {
                        let prefix = code_type.get('prefix') + '-';
                        result.filter(code => {
                            output.push(prefix + code.key);
                        });
                    } else {
                        output.push(
                            code_type.get('prefix') + '-' + result.get('key')
                        );
                    }
                    res.send({ codes: output });
                });
            }
        });
    }

    validate(req, res) {
        let messages = {
            INVALID: 'Code is invalid',
            EXPIRED: 'Code expired',
            SUCCESS: 'Code Applied Successfully'
        };
        let code = req.params.key;
        if (code.split('-').length != 2) {
            return res.send({
                error: 'INVALID_FORMAT',
                message: 'Code format is incorrect'
            });
        }
        let key = code.split('-')[1];
        this.CodeModel.find({
            where: {
                key: key
            }
        })
            .then(code => {
                if (code && code.get('key')) {
                    if (code.is_used)
                        return Promise.reject({
                            error: 'USED_CODE',
                            message: messages['INVALID'],
                            code: 406
                        });
                    else if (code.get('end_date') != 'false') {
                        let code_expiry = code.get('end_date');
                        if (new Date() <= code_expiry)
                            return Promise.resolve(code);
                        else
                            return Promise.reject({
                                error: 'EXPIRED',
                                message: messages['EXPIRED'],
                                code: 406
                            });
                    } else {
                        let used = code.get('use_count');
                        if (used > 0) return Promise.resolve(code);
                        else
                            return Promise.reject({
                                error: 'LIMIT_REACHED',
                                message: messages['INVALID'],
                                code: 406
                            });
                    }
                } else
                    return Promise.reject({
                        error: 'INVALID',
                        message: messages['INVALID'],
                        code: 406
                    });
            })
            .then(code => {
                let used = code.get('use_count');
                let update_values = {
                    use_count: used - 1
                };
                if (used - 1 == 0) update_values['is_used'] = true;
                code.update(update_values).then(new_code => {
                    res.send({
                        data: 'SUCCESS',
                        code: req.params.key,
                        message: messages['SUCCESS']
                    });
                });
            })
            .catch(err => {
                res.send(err);
            });
    }

    retrieve(req, res) {
        // let params = {
        //   "filter": "valid_codes | expired_codes | used_codes",
        //   "prefix": "CODE_TYPE_PREFIX", // optional
        // }
        let params = req.body;
        let filter = {};
        let inside_filter = {};
        if (params.hasOwnProperty('prefix'))
            inside_filter['prefix'] = params.prefix;
        switch (params.filter) {
            case 'valid_codes':
                filter['is_used'] = false;
                filter['end_date'] = {
                    $gte: Date.parse(new Date())
                };
                break;
            case 'expired_codes':
                filter['use_count'] = {
                    $gt: 0
                };
                filter['end_date'] = {
                    $lte: Date.parse(new Date())
                };
                break;
            case 'used_codes':
                filter['is_used'] = true;
                break;
        }
        this.CodeModel.findAll({
            where: filter,
            include: [
                {
                    model: models.code_type,
                    where: inside_filter
                }
            ]
        })
            .then(codes => {
                if (codes) {
                    let result = [];
                    codes.map(code => {
                        let _date = new Date(Number(code.end_date));
                        let output = {
                            code: code.code_type.prefix + '-' + code.key,
                            use_count: code.use_count,
                            type: code.code_type.name,
                            end_date: moment(_date).format('MM-DD-YYYY')
                        };
                        if (
                            code.hasOwnProperty('end_date') &&
                            code['end_date']
                        ) {
                            if (code['end_date'] != 'false')
                                output['end_date'] = code['end_date'];
                        }
                        result.push(output);
                    });
                    res.send(result);
                } else
                    res.send({
                        error: 'NOT_FOUND'
                    });
            })
            .catch(err => {
                console.log(err);
            });
    }
}
