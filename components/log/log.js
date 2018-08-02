const express = require('express');
const logconfig = require('./logconfig.json');
const winston = require('winston'),
	expressWinston = require('express-winston');

const router = express.Router();

// Time stamp helper for log entry
const currentDateTime = () => {
	return new Date().toISOString();
}

// Instantiate the logger
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: logconfig.filepath.logFileError, level: 'error' }),
		new winston.transports.File({ filename: logconfig.filepath.logFileInfo })
	]
});

// Make a log entry
const logEntry = (level, message) => {
	logger.log({
		level: level,	
		message: currentDateTime() + ' ' + message 
	})	
}

module.exports = {
	logger: logger,
	logEntry: logEntry
}