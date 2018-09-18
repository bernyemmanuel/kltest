exports.getVersion = (req, res) => {
    sendResponse(res, null, {
        version: '1.3.2',
        message: 'Camry'
    });
};
