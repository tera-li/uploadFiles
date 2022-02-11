// 引入express
// 构建web服务器 && 构建api服务器
const express = require("express");
// 引入multer
// multer中间件对multipart/form-data格式的数据进行操作
const multer = require("multer");
const path = require("path");
// 引入post的body解析
const bodyParser = require("body-parser");
const format = require('silly-datetime')
const mkdirp = require('mkdirp')

const res = require("./config/header");
const upload = require("./upload_file");

// 实例化multer中间件
const multerMidd = multer({
  //设置上传的的图片保存目录
  storage: multer.diskStorage({
    // 存储目录（当前img目录）
    destination: function (req, file, cb) {
      const date = format.format(new Date, 'YYYYMMDD')
      const url = path.resolve(__dirname + `/img/${date}`)
      mkdirp.sync(url)
      cb(null, url);
    },
    // 需要存储的文件名
    filename: function (req, file, cb) {
      // 取出后缀
      const name = file.originalname.slice(file.originalname.lastIndexOf("."));
      // 拼接存储文件名
      cb(null, Date.now() + name);
    },
  }),
  // 文件拦截
  fileFilter: (req, file, cb) => {
    // 只有image类型才能通过multer中间件
    if (file.mimetype.includes("image")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// 定义multer文件上传方法
let getFile = multerMidd.single("file");
let getFiles = multerMidd.array("file");

// 使用express
const app = express();
// 处理所有响应，设置响应头
app.all("*", res.restHeader);
app.get('/', (req, res) => {
  res.end('启动成功')
})
// 单文件上传
app.post("/upload", getFile, upload.file);
// 多文件上传
app.post("/uploads", getFiles, upload.files);
// 视频上传（切片）
app.post("/video", upload.video);
// 视频上传（断点查询）
app.use(bodyParser.json({ type: "application/*+json" }));
app.post("/getSize", upload.getSize);

// 开启本地端口侦听
app.listen(8080, () => {
  console.log('server running in the http://localhost:8080')
});
