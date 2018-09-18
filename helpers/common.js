const buildSuccess = data => {
    if (data) return { status: 'SUCCESS', data };
    return { status: 'SUCCESS' };
};

const buildError = (code, message) => ({
    status: 'FAILED',
    error: {
        code,
        message
    }
});

exports.sendAjaxResult = (res, err, result, conn) => {
    if (conn) {
        conn.end();
    }
    if (!err) {
        res.status(200).jsonp(buildSuccess(result));
    } else if (
        typeof err === 'object' &&
        typeof err.code !== 'undefined' &&
        typeof err.message !== 'undefined'
    ) {
        res.status(200).jsonp(buildError(err.code, err.message));
    } else if (err === 'invalid_access_token') {
        res.status(200).jsonp(buildError(1000, 'Invalid Access Token'));
    } else if (err === 'invalid_user') {
        res.status(200).jsonp(buildError(1001, 'Invalid Access Token or UID'));
    } else if (err === 'invalid_verification_request') {
        res.status(200).jsonp(
            buildError(1002, 'Invalid Request Id or Mobile Number')
        );
    } else if (err === 'invalid_code') {
        res.status(200).jsonp(buildError(1003, 'Invalid Verfication Code'));
    } else if (err === 'invalid_request') {
        res.status(200).jsonp(buildError(1004, 'No UID in request'));
    } else if (err === 'invalid_image_format') {
        res.status(200).jsonp(buildError(2000, 'Invalid File Format'));
    } else if (err === 'invalid_params') {
        res.status(200).jsonp(buildError(2000, 'Invalid parameters'));
    } else if (err === 'custom') {
        res.status(200).jsonp(buildError(result.code, result.message));
    } else {
        // should be last condition
        res.status(500).jsonp(buildError(500, 'Internal server error'));
    }
};

exports.connectMysql = conn =>
    new Promise((resolve, reject) => {
        conn.connect(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
