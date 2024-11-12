const path = require("path");
const fs = require("fs");

function readLocalJsonFile(fp) {
  // 构造文件的绝对路径
  const filePath = path.join(process.cwd(), "/public", fp);

  // 同步读取文件内容并解析 JSON
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContents);
  return data;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRoom(id) {
  return `ROOM-${id}`;
}

function getRoleLabel({ server, name }) {
  return `${server}·${name}`;
}

module.exports = { readLocalJsonFile, getRandomInt, getRoom, getRoleLabel };
