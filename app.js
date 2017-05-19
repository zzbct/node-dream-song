var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookie = require('cookie-parser');
var bodyParser = require('body-parser');
var Robot = require('./public/javascripts/robot.js');
var http = require('http');
//引入cors包
var cors = require('cors');
var cheerio = require('cheerio');
var index = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//配置cors
app.use(cors({
  origin: ['http://localhost:8080'],
  methods: ['Get','POST'],
  alloweHeaders: ['Conten-Type','Authorization']
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookie());


//访问public文件夹下的文件
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

//爬虫程序实例化
var op = {
  host: 'http://music.163.com'
}
var robot = new Robot(op);

//获取个性推荐的img数据
app.get('/img',function(req,resq){
  var path = 'http://music.163.com/discover';
  var p = new Promise(function(resolve,reject){
    robot.go(path,'script',resolve);
  })
  p.then(function(data){
    var original = data[2].children[0].data
    var start = original.indexOf('[');
    var end = original.lastIndexOf(']')+1;
    var result = eval('('+original.substring(start,end)+')');
    resq.send(result);
  })
})

//获取歌单列表
app.get('/songList',function(req,resq){
  var reqData = [];
  var path = '/discover/playlist';
  var p = new Promise(function(resolve,reject){
    robot.go(path,'#m-pl-container li',resolve);
  })
  p.then(function(data){
     var itemList = [];
     var $ = cheerio.load(data);
     data.each(function() {
       var cap = $(this);
       var item = {
         src: cap.find('img.j-flag').attr('src'),//图片路径
         title: cap.find('a.msk').attr('title'),//歌单名称
         id: cap.find('a.f-fr').attr('data-res-id'),//歌单id
         type: cap.find('a.f-fr').attr('data-res-type'),//歌单种类
         nb: cap.find('span.nb').text(),//歌单播放量
         creater: cap.find('a.s-fc3').text(),//歌单发行者
         byhref: cap.find('a.s-fc3').attr('href'),//发行者地址
         hasStar: cap.find('sup.u-icn-84').length,
         hasWy: cap.find('sup.u-icn2-music2').length,
         hasV: cap.find('sup.u-icn-1').length
      };
      itemList.push(item);
    })
    resq.json(itemList);
  })
})

//获取单个歌单信息
app.get('/secondList',function(req,resq){
  var reqData = [];
  var context = '#song-list-pre-cache';
  var params = req.query;
  var path = '/playlist?id=' + params.id;
  var p = new Promise(function(resolve,reject){
    robot.go(path,'#song-list-pre-cache textarea',resolve);
  })
  p.then(function(data){
    var result = eval('('+data.text()+')');
    resq.send(result);
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
