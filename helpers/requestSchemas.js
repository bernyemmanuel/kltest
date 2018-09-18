import joi from 'joi';

const LoginRequest = joi.object().keys({
    mobile_number: joi
        .number()
        .integer()
        .min(1000000000)
        .max(9999999999)
        .required(),
    country_code: joi.any().valid('+91', '+1', '+82'),
    device_type: joi.any().valid('ANDROID', 'IOS'),
    device_id: joi.string().required()
});

const LoginVerification = joi.object().keys({
    code: joi
        .string()
        .length(6)
        .required(),
    request_id: joi
        .string()
        .length(32)
        .required(),
    mobile_number: joi
        .number()
        .integer()
        .min(1000000000)
        .max(9999999999)
        .required(),
    new_user: joi.boolean().required()
});

const GetEthereumAccountBalance = joi.object().keys({
    public_address: joi.string().required()
});

const SendTransaction = joi.object().keys({
    transaction_hash: joi.string().required()
});

const LoadEther = joi.object().keys({
    ether: joi.string().required(),
    public_address: joi.string().required()
});

const GetTransactionCount = joi.object().keys({
    public_address: joi.string().required()
});

const GetAssetDetails = joi.object().keys({
    asset_id: joi.number().required()
});

const FollowUnfollowAsset = joi.object().keys({
    asset_id: joi.number().required()
});

const UpdateEmail = joi.object().keys({
    first_name: joi.string().required(),
    last_name: joi.string().required(),
    email_id: joi
        .string()
        .email()
        .required()
});

const BuyAsset = joi.object().keys({
    asset_id: joi.number().required(),
    amount: joi
        .number()
        .max(999999)
        .required(),
    payment_method: joi
        .any()
        .valid('UPI', 'CARD', 'BANK', 'WALLET')
        .required(),
    wallet_amount: joi.number().required()
});
const SellAsset = joi.object().keys({
    asset_id: joi.number().required(),
    quantity: joi
        .number()
        .max(999999)
        .required()
});

const UpdateUserDetails = joi.object().keys({
    // email_id: joi.alternatives().try(joi.any().empty(), joi.string().email()),
    first_name: joi.string(),
    last_name: joi.string(),
    dw_account_id: joi.string(),
    dw_user_id: joi.string()
});

const RedeemCode = joi.object().keys({
    code: joi.string().required()
});

const PassCode = joi.object().keys({
    code: joi.string().required()
});

const ResetCode = joi.object().keys({
    curr_code: joi.string().required(),
    new_code: joi.string().required()
});

const SupportMessage = joi.object().keys({
    message: joi.string().required(),
    type: joi.string().required()
});

export {
    LoginRequest,
    LoginVerification,
    GetAssetDetails,
    FollowUnfollowAsset,
    UpdateEmail,
    BuyAsset,
    SellAsset,
    UpdateUserDetails,
    GetEthereumAccountBalance,
    LoadEther,
    SendTransaction,
    GetTransactionCount,
    RedeemCode,
    PassCode,
    ResetCode,
    SupportMessage
};
