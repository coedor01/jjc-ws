const { Server } = require("socket.io");
const {
  readLocalJsonFile,
  getRandomInt,
  getRoom,
  getRoleLabel,
} = require("./utils");
const {
  $错误,
  $状态变动,
  $房间内广播_状态变动,
  $角色信息变动,
  $房间中_房间信息,
  $房间中_人员变动,
  $房间中_房间状态变更,
  $静态数据变动,
} = require("./actions");
const { 客户端事件 } = require("./events");
const { 角色状态类型, 房间状态类型 } = require("./const");
const { logger } = require("./log");
const { getRoleAttribute } = require("./api");

const io = new Server(13000, {
  cors: {
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
    credentials: true,
  },
});

const servers = readLocalJsonFile("servers.json");
const teamTypes = readLocalJsonFile("teamTypes.json");
const clientTypes = readLocalJsonFile("clientTypes.json");

const roleStatusMap = new Map();
const roomsMap = new Map();
const roomMembersMap = new Map();

io.on("connection", (socket) => {
  logger.info(`客户端 ${socket.handshake.address} 成功建立连接`);

  $状态变动(socket, { 状态: 角色状态类型.选择角色, 是否正在匹配: false });

  $静态数据变动(socket, {
    服务器: servers,
    招募类型: teamTypes,
    客户端类型: clientTypes,
  });

  let server = null;
  let name = null;
  socket.on(客户端事件.选择角色_选定, async (msg) => {
    server = msg?.server;
    name = msg?.name;

    if (server && name) {
      const gameRole = await getRoleAttribute({ server, name });
      let 角色状态信息 = roleStatusMap.get(getRoleLabel({ server, name }));
      if (!角色状态信息?.状态) {
        角色状态信息 = {
          状态: 角色状态类型.首页,
          是否正在匹配: false,
        };
        $状态变动(socket, 角色状态信息);
        roleStatusMap.set(getRoleLabel({ server, name }), 角色状态信息);
      } else {
        $状态变动(socket, 角色状态信息);
        if (角色状态信息.状态 === 角色状态类型.房间中) {
          const 房间 = roomsMap.get(角色状态信息.数据.房间ID);
          const 成员 = roomMembersMap.get(角色状态信息.数据.房间ID);
          $房间中_房间信息(socket, {
            房间ID: 房间.编号,
            成员: 成员,
            是否房主: getRoleLabel({ server, name }) === 房间.房主,
            状态: 房间.状态,
          });
        }
      }
      $角色信息变动(socket, gameRole);

      logger.info(
        `客户端 ${socket.handshake.address} 选定角色 ${name}·${server}。`
      );
    } else {
      logger.info(
        `客户端 ${socket.handshake.address} 鉴权失败，角色 ${name}·${server} 登陆失败。`
      );
      socket.disconnect(true);
    }
  });

  socket.on("disconnect", () => {
    logger.info(`客户端 ${socket.handshake.address} 断开连接。`);
  });

  socket.on(客户端事件.首页_创建房间, async (msg) => {
    let id = null;
    do {
      id = getRandomInt(100000, 999999);
    } while (id && roomsMap.has(id));
    const owner = await getRoleAttribute({ server, name });
    const 房间 = {
      编号: id,
      密码: msg.password,
      房主: getRoleLabel({ server, name }),
      状态: 房间状态类型.等待中,
    };
    const 成员 = [owner];
    roomsMap.set(id, 房间);
    roomMembersMap.set(id, 成员);
    socket.join(getRoom(id));
    logger.info(
      `角色 ${name}·${server} 新建房间：房间号为 ${id}，密码为 ${msg.password}。`
    );
    $状态变动(socket, { 状态: 角色状态类型.房间中, 是否正在匹配: false });
    roleStatusMap.set(getRoleLabel({ server, name }), {
      状态: 角色状态类型.房间中,
      数据: { 房间ID: 房间.编号 },
    });
    $房间中_房间信息(socket, {
      房间ID: 房间.编号,
      成员: 成员,
      是否房主: true,
      状态: 房间.状态,
    });
  });

  socket.on(客户端事件.首页_加入房间, async (msg) => {
    const 房间 = roomsMap.get(msg.roomId);
    if (!房间) {
      $错误(socket, { 错误码: 10000, 错误信息: "房间不存在" });
      return;
    }
    if (房间.密码 !== msg.password) {
      $错误(socket, { 错误码: 10001, 错误信息: "房间密码错误" });
      return;
    }
    const member = await getRoleAttribute({ server, name });
    const members = [member, ...roomMembersMap.get(房间.编号)];
    roomMembersMap.set(房间.编号, members);
    logger.info(`角色 ${name}·${server} 加入 ${msg.roomId} 房间。`);
    $状态变动(socket, { 状态: 角色状态类型.房间中, 是否正在匹配: false });
    roleStatusMap.set(getRoleLabel({ server, name }), {
      状态: 角色状态类型.房间中,
      数据: { 房间ID: 房间.编号 },
    });
    $房间中_房间信息(socket, {
      房间ID: 房间.编号,
      成员: members,
      是否房主: false,
      状态: 房间.状态,
    });
    $房间中_人员变动(io, getRoom(房间.编号), {
      成员: members,
    });
    socket.join(getRoom(房间.编号));
  });

  socket.on(客户端事件.首页_开始单人匹配, (msg) => {
    const 角色状态信息 = roleStatusMap.get(getRoleLabel({ server, name }));
    logger.info(
      `${getRoleLabel({
        server,
        name,
      })} 开始单人匹配：招募类型ID-${msg.teamTypeId}，客户端类型ID-${
        msg.clientTypeId
      }`
    );
    $状态变动(socket, { 状态: 角色状态信息.状态, 是否正在匹配: true });
  });

  socket.on(客户端事件.首页_取消单人匹配, (msg) => {
    const 角色状态信息 = roleStatusMap.get(getRoleLabel({ server, name }));
    logger.info(
      `${getRoleLabel({
        server,
        name,
      })} 结束单人匹配。`
    );
    $状态变动(socket, { 状态: 角色状态信息.状态, 是否正在匹配: false });
  });

  socket.on(客户端事件.房间中_退出房间, (msg) => {
    if (角色状态信息.状态 === 角色状态类型.首页) {
      logger.info(
        `${getRoleLabel({
          server,
          name,
        })} 开始单人匹配：招募类型ID-${msg.teamTypeId}，客户端类型ID-${
          msg.clientTypeId
        }`
      );
    } else {
      $错误(socket, { 错误码: 10002, 错误信息: "权限不足" });
    }
  });

  socket.on(客户端事件.房间中_开始匹配, (msg) => {
    const 角色状态信息 = roleStatusMap.get(getRoleLabel({ server, name }));
    logger.info(JSON.stringify(角色状态信息));
    const 房间ID = 角色状态信息?.数据?.房间ID;
    if (角色状态信息.状态 === 角色状态类型.房间中 && 房间ID) {
      logger.info(
        `${getRoleLabel({
          server,
          name,
        })} 在房间${房间ID}中开始匹配：招募类型ID-${
          msg.teamTypeId
        }，客户端类型ID-${msg.clientTypeId}`
      );
      $房间中_房间状态变更(io, getRoom(房间ID), { 状态: 房间状态类型.匹配中 });
      $状态变动(socket, { 状态: 角色状态信息.状态, 是否正在匹配: true });
    } else {
      $错误(socket, { 错误码: 10002, 错误信息: "权限不足" });
    }
  });

  socket.on(客户端事件.房间中_取消匹配, () => {
    const 角色状态信息 = roleStatusMap.get(getRoleLabel({ server, name }));
    logger.info(JSON.stringify(角色状态信息));
    const 房间ID = 角色状态信息?.数据?.房间ID;
    if (角色状态信息.状态 === 角色状态类型.房间中 && 房间ID) {
      logger.info(
        `${getRoleLabel({
          server,
          name,
        })} 在房间${房间ID}中取消匹配`
      );
      $房间中_房间状态变更(io, getRoom(房间ID), { 状态: 房间状态类型.等待中 });

      const 成员 = roomMembersMap.get(房间ID);

      for (const 单个成员 of 成员) {
        const 单个成员角色状态信息 = roleStatusMap.get(
          getRoleLabel({ server: 单个成员.serverName, name: 单个成员.roleName })
        );
        $房间内广播_状态变动(io, getRoom(房间ID), {
          状态: 单个成员角色状态信息.状态,
          是否正在匹配: false,
        });
      }
    } else {
      $错误(socket, { 错误码: 10002, 错误信息: "权限不足" });
    }
  });

  socket.on(客户端事件.匹配成功_确认, (msg) => {});

  socket.on(客户端事件.匹配成功_取消, (msg) => {});

  socket.on(客户端事件.队伍中_发送消息, (msg) => {});
});

logger.info("Socket.IO 服务在端口13000上运行。");
