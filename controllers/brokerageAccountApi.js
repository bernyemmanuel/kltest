const request = require('request');

exports.checkUsername = (req, res) => {
    const options = {
        method: 'GET',
        url: 'http://api.drivewealth.io/v1/users',
        qs: req.body,
        headers: {
            'postman-token': 'e01ad7ce-9a36-b77a-5a02-d27c5438d727',
            'cache-control': 'no-cache',
            'x-mysolomeo-session-key':
                '5839940b-751e-4275-af11-7cb8d45a11cf.2017-10-13T22:31:29.849Z',
            'content-type': 'application/json',
            accept: 'application/json'
        }
    };

    request(options, (error, response, body) => {
        if (error) {
            sendResponse(res, error);
        } else {
            const result = JSON.parse(body);
            const usernameExists = result.code === 200;
            sendResponse(res, null, { usernameExists });
        }
    });
};

exports.createAccount = (req, res) => {
    let userID;
    const {
        username,
        password,
        gender,
        homeAddress,
        officeAddress,
        dob,
        businessType,
        employerName,
        isBroker,
        employmentPosition,
        employmentStatus,
        yearsEmployed,
        annualIncome,
        objective,
        experience,
        tolerance,
        liquidNetworth,
        totalNetworth,
        isExecutive,
        companyName,
        isPep,
        officialNames
    } = req.body.brokerageAccount;
    const userDetail = {
        username,
        password,
        firstName: 'Bob',
        lastName: 'Kalhatti',
        emailAddress1: 'bob@kalhatti.com',
        wlpID: 'DW'
    };
    const createUserOptions = {
        method: 'POST',
        url: 'http://api.drivewealth.io/v1/signups/live',
        body: userDetail,
        json: true,
        headers: {
            'postman-token': 'e01ad7ce-9a36-b77a-5a02-d27c5438d727',
            'cache-control': 'no-cache',
            'x-mysolomeo-session-key':
                '5839940b-751e-4275-af11-7cb8d45a11cf.2017-10-13T22:31:29.849Z',
            'content-type': 'application/json',
            accept: 'application/json'
        }
    };

    request(createUserOptions, (error, response, body) => {
        if (error) {
            sendResponse(res, error);
        } else if (response.statusCode === 200) {
            userID = body.userID;
            const accountDetail = {
                ownershipType: 'Individual',
                wlpID: 'DW',
                referralCode: 'E72AB9',
                tradingType: 'c',
                usCitizen: false,
                citizenship: 'IND',
                userID,
                firstName: 'Bob',
                lastName: 'Kalhatti',
                emailAddress1: 'bob@kalhatti.com',
                username,
                password,
                gender,
                phoneHome: '111',
                addressLine1: homeAddress.street1,
                addressLine2: homeAddress.street2,
                city: homeAddress.city,
                countryID: homeAddress.country,
                stateProvince: homeAddress.state,
                zipPostalCode: homeAddress.postalCode,
                dob,
                idNo: '111',
                employerBusiness: businessType,
                employerCompany: employerName,
                employerAddressLine1: officeAddress.street1,
                employerAddressLine2: officeAddress.street2,
                employerCity: officeAddress.city,
                employerStateProvince: officeAddress.state,
                employerZipPostalCode: officeAddress.postalCode,
                employerCountryID: officeAddress.country,
                employerIsBroker: isBroker,
                employmentPosition,
                employmentStatus,
                employmentYears: yearsEmployed,
                annualIncome,
                investmentObjectives: objective,
                investmentExperience: experience,
                riskTolerance: tolerance,
                networthLiquid: liquidNetworth,
                networthTotal: totalNetworth,
                director: isExecutive,
                directorOf: companyName,
                politicallyExposed: isPep,
                politicallyExposedNames: officialNames,
                disclosureAck: true,
                disclosureRule14b: true,
                ackCustomerAgreement: true,
                ackSweep: true,
                ackMarketData: true,
                ackSignedBy: 'Bob Kalhatti',
                ackSignedWhen: new Date().toUTCString()
            };

            const createAccountOptions = {
                method: 'POST',
                url: 'http://api.drivewealth.io/v1/signups/live',
                body: accountDetail,
                json: true,
                headers: {
                    'postman-token': 'e01ad7ce-9a36-b77a-5a02-d27c5438d727',
                    'cache-control': 'no-cache',
                    'x-mysolomeo-session-key':
                        '5839940b-751e-4275-af11-7cb8d45a11cf.2017-10-13T22:31:29.849Z',
                    'content-type': 'application/json',
                    accept: 'application/json'
                }
            };

            request(createAccountOptions, (error2, response2, body2) => {
                if (error2) {
                    sendResponse(res, error2);
                } else {
                    sendResponse(res, null, body2);
                }
            });
        } else {
            sendResponse(res, null, body);
        }
    });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    const loginDetail = {
        username,
        password,
        appTypeID: '2000',
        appVersion: '0.1',
        languageID: 'en_US',
        osType: 'DW',
        osVersion: 'iOS',
        scrRes: '1920x1080',
        ipAddress: '1.1.1.1'
    };

    const loginOptions = {
        method: 'POST',
        url: 'http://api.drivewealth.io/v1/userSessions',
        body: loginDetail,
        json: true,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            accept: 'application/json'
        }
    };

    request(loginOptions, (error, response, body) => {
        if (error) {
            sendResponse(res, error);
        } else if (response.statusCode === 404) {
            sendResponse(res, body);
        } else {
            sendResponse(res, null, body.sessionKey);
        }
    });
};
