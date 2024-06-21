import mysql from 'mysql';
import config from './config.js';

const TsukimenDB = mysql.createPool(config.tsukimenDB);

export default TsukimenDB;