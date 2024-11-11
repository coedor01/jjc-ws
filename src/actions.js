function $当前状态(socket, { 状态, 数据 }) {
  socket.emit("当前状态", { 状态, 数据 });
}

function $房间中_人员变动(socket, { 服务器, 游戏昵称, 进或出 }) {
  socket.emit("房间中_人员变动", { 服务器, 游戏昵称, 进或出 });
}

function $匹配中_有人确认(socket, { 服务器, 游戏昵称 }) {
  socket.emit("匹配中_有人确认", { 服务器, 游戏昵称 });
}

function $队伍中_新消息(socket, { 服务器, 游戏昵称, 内容 }) {
  socket.emit("队伍中_新消息", { 服务器, 游戏昵称, 内容 });
}

module.exports = {
  $当前状态,
  $房间中_人员变动,
  $匹配中_有人确认,
  $队伍中_新消息,
};
