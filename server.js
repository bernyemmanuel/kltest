import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import fs from 'fs';
import promise from 'bluebird';
import jwt from 'jsonwebtoken';
import path from 'path';
import morgan from 'morgan';

global.validateParams = promise.promisify(require('joi').validate);

global.fs = fs;
global.Promise = promise;
global.path = path;
global.rootLocation = __dirname;

const swaggerJSDoc = require('swagger-jsdoc');
const errorLog = require('./helpers/logger').errorlog;
const expressLogger = require('./helpers/logger').expressLogger;
global.console.error = errorLog.error;

global.config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
global.mysql = require('./helpers/mysql_connector');
global.sendResponse = require('./helpers/common').sendAjaxResult;
global.connectMysql = require('./helpers/common').connectMysql;

const adminApiRouter = require('./routes/admin');
const apiRouter = require('./routes/index');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
// swagger definition
var swaggerDefinition = {
    info: {
        title: 'Kalhatti Swagger API',
        version: '1.0.0',
        description: 'Demonstrating how to describe a RESTful API with Swagger'
    },
    host: `localhost:${config.server.port}`,
    basePath: '/'
};

// options for the swagger docs
var options = {
    // import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // path to the API docs
    apis: ['./routes/*.js'] // pass all in array
};
// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

app.get('/api.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

const router = express.Router();

app.use(morgan('tiny'));

apiRouter.all('*', (req, res, next) => {
    res.sendStatus(404);
});

app.use(expressLogger);
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
app.use(helmet());
app.use('/api', apiRouter);
app.use('/admin', adminApiRouter);
app.use(router);

const port = config.server.port;
app.listen(port, () => {
    console.log(
        `Kalhatti - RESTful API running on http://localhost:${port.toString()} \nDocumentation can be found at http://localhost:${port.toString()}/api-docs`
    );
});
