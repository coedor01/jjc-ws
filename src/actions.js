function $错误(socket, { 错误码, 错误信息 }) {
  socket.emit("$错误", { 错误码, 错误信息 });
}

function $状态变动(socket, { 状态, 是否正在匹配 }) {
  socket.emit("状态变动", { 状态, 是否正在匹配 });
}

function $房间内广播_状态变动(io, room, { 状态, 是否正在匹配 }) {
  io.to(room).emit("状态变动", { 状态, 是否正在匹配 });
}

function $角色信息变动(socket, data) {
  socket.emit("角色信息变动", data);
}

function $静态数据变动(socket, { 服务器, 招募类型, 客户端类型 }) {
  socket.emit("静态数据变动", { 服务器, 招募类型, 客户端类型 });
}

function $房间中_房间信息(socket, { 房间ID, 成员, 是否房主, 状态 }) {
  socket.emit("房间中_房间信息", { 房间ID, 成员, 是否房主, 状态 });
}

function $房间中_人员变动(io, room, { 成员 }) {
  io.to(room).emit("房间中_人员变动", { 成员 });
}

function $房间中_房间状态变更(io, room, { 状态 }) {
  io.to(room).emit("房间中_房间状态变更", { 状态 });
}

function $匹配中_有人确认(socket, { 服务器, 游戏昵称 }) {
  socket.emit("匹配中_有人确认", { 服务器, 游戏昵称 });
}

function $队伍中_新消息(socket, { 服务器, 游戏昵称, 内容 }) {
  socket.emit("队伍中_新消息", { 服务器, 游戏昵称, 内容 });
}

module.exports = {
  $错误,
  $状态变动,
  $房间内广播_状态变动,
  $角色信息变动,
  $静态数据变动,
  $房间中_房间信息,
  $房间中_人员变动,
  $房间中_房间状态变更,
  $匹配中_有人确认,
  $队伍中_新消息,
};
