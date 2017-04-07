/**
 * 爬虫
 * Created by Candy程
 */

var http = require('http');
var cheerio = require('cheerio');
var request = require('request');


var Robot = function(options) {
	var _this = this;
	_this.host = options.host || '';
}

/**
 * 爬虫主程序
 * @param  {[type]} path     [url路径]
 * @param  {[type]} selector [cheerio的爬虫标签]
 * @param  {[type]} resolve  [promise成功时封装数据]
 * @return {[type]}          [description]
 */
Robot.prototype.go = function(path,selector,resolve) {
	var url = this.host + path;
	http.get(url,function(res) {
		var htmls = '';
		res.on("data",function(data) {
			htmls += data;
		})
		res.on('end',function() {
			var $=cheerio.load(htmls);
	        resolve($(selector));
		})
	})
}
module.exports = Robot;