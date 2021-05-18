// 单文件上传
module.exports.file = (req, res) => {
  let errMsg = "";
  if (!req.file) errMsg = "文件应为image";
  res.send({
    code: 0,
    msg: errMsg || "单文件上传成功",
  });
};

// 多文件上传
module.exports.files = (req, res) => {
  let errMsg = "";
  if (req.files.length === 0) errMsg = "文件应为image";
  res.send({
    code: 0,
    msg: errMsg || "多文件上传成功",
  });
};

// 文件上传
const formidable = require("formidable");
// 文件系统模块
const fs = require("fs");
// 系统路径模块
const path = require("path");

// 视频上传(切片)
const handleStream = (item, writeStream) => {
  // 读取对应目录文件buffer
  const readFile = fs.readFileSync(item);
  // 将读取的buffer || chunk写入到stream中
  writeStream.write(readFile);
  // 写入完后，清除暂存的文件
  fs.unlink(item, () => {});
};

module.exports.video = (req, res) => {
  // 创建解析对象
  const form = new formidable.IncomingForm();
  // 设置视频文件上传路径
  let dirPath = path.join(__dirname, "video");
  form.uploadDir = dirPath;
  // 是否保留上传文件名后缀
  form.keepExtensions = true;
  form.parse(req, async (err, fields, file) => {
    // err 错误对象 如果解析失败包含错误信息
    // fields 包含除了二进制以外的formData的key-value对象
    // file 对象类型 上传文件的信息

    // 获取上传文件blob对象
    let files = file.file;
    // 获取当前切片index
    let index = fields.index;
    // 获取总切片数
    let total = fields.total;
    // 获取文件名
    let filename = fields.filename;
    // 重写上传文件名，设置暂存目录
    let url =
      dirPath +
      "/" +
      filename.split(".")[0] +
      `_${index}.` +
      filename.split(".")[1];
    try {
      // 同步修改上传文件名
      fs.renameSync(files.path, url);
      console.log(url);

      // 判断是否是最后一个切片上传完成，拼接写入全部视频
      setTimeout(() => {
        if (index === total) {
          // 同步创建新目录，用以存放完整视频
          let newDir = __dirname + `/uploadFiles/${Date.now()}`;
          // 创建目录
          fs.mkdirSync(newDir);
          // 创建可写流，用以写入文件
          let writeStream = fs.createWriteStream(newDir + `/${filename}`);
          let fsList = [];
          // 取出所有切片文件，放入数组
          for (let i = 0; i < total; i++) {
            const fsUrl =
              dirPath +
              "/" +
              filename.split(".")[0] +
              `_${i + 1}.` +
              filename.split(".")[1];
            fsList.push(fsUrl);
          }
          // 循环切片文件数组，进行stream流的写入
          for (let item of fsList) {
            handleStream(item, writeStream);
          }
          // 全部写入，关闭stream写入流
          writeStream.end();
        }
      }, 100);
    } catch (e) {
      console.log(e);
    }
    res.send({
      code: 0,
      msg: "上传成功",
      size: index,
    });
  });
};
module.exports.getSize = (req, res) => {
  let count = 0;
  req.setEncoding("utf8");
  req.on("data", function (data) {
    let name = JSON.parse(data);
    let dirPath = path.join(__dirname, "video");
    // 计算已上传的切片文件个数
    let files = fs.readdirSync(dirPath);
    files.forEach((item, index) => {
      let url =
        name.fileName.split(".")[0] +
        `_${index + 1}.` +
        name.fileName.split(".")[1];
      if (files.includes(url)) {
        ++count;
      }
    });
    res.send({
      code: 1,
      msg: "请继续上传",
      count,
    });
  });
};
