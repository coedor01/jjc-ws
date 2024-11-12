const { Server } = require("socket.io");
const { readLocalJsonFile, getRandomInt } = require("./utils");
const { $当前状态 } = require("./actions");
const { 客户端事件 } = require("./events");
const { 状态类型 } = require("./const");
const { logger } = require("./log");

const io = new Server(13000, {
  cors: {
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
    credentials: true,
  },
});

const teamTypes = readLocalJsonFile("teamTypes.json");
const clientTypes = readLocalJsonFile("clientTypes.json");

const roomsMap = new Map();

io.on("connection", (socket) => {
  // 连上后，5秒内需要发送鉴权包，否则自动断开连接
  logger.info(
    `客户端 ${socket.handshake.address} 等待鉴权，5秒钟未鉴权将自动关闭连接`
  );

  let server = null;
  let name = null;
  setTimeout(() => {
    if (!server || !name) {
      socket.disconnect(true);
    }
  }, 5000);

  socket.on("disconnect", () => {
    logger.info(
      `客户端 ${socket.handshake.address} 因超时未鉴权，自动断开连接`
    );
  });

  socket.on(客户端事件.鉴权, (msg) => {
    server = msg?.server;
    name = msg?.name;

    if (server && name) {
      $当前状态(socket, {
        状态: 状态类型.首页,
        数据: {
          teamTypes: teamTypes,
          clientTypes: clientTypes,
          gameRole: {
            zoneName: "电信区",
            roleName: "花间游不动",
            serverName: "唯我独尊",
            kungfuId: "10028",
            panelList: { score: 466666, panel: [] },
          },
          myRoom: null,
        },
      });
      logger.info(
        `客户端 ${socket.handshake.address} 鉴权成功，角色 ${name}·${server} 登陆成功。`
      );
    } else {
      logger.info(
        `客户端 ${socket.handshake.address} 鉴权失败，角色 ${name}·${server} 登陆失败。`
      );
      socket.disconnect(true);
    }
  });

  socket.on(客户端事件.首页_创建房间, (msg) => {
    let id = null;
    do {
      id = getRandomInt(100000, 999999);
    } while (id && roomsMap.has(id));
    roomsMap.set(id, { id, password: msg.password });
    logger.info(
      `角色 ${name}·${server} 新建房间：房间号为 ${id}，密码为 ${msg.password}。`
    );
    $当前状态(socket, {
      状态: 状态类型.房间中,
      数据: {
        id,
        teamTypes,
        clientTypes,
        members: [
          {
            zoneName: "电信区",
            roleName: "花间游不动",
            serverName: "唯我独尊",
            kungfuId: "10028",
            panelList: { score: 466666, panel: [] },
          },
        ],
        isOwner: true,
      },
    });
  });

  socket.on(客户端事件.首页_加入房间, (msg) => {
    const room = roomsMap.get(msg.roomId);
    if (!room) {
      socket.emit("$Error", {
        code: 10000,
        detail: "房间不存在",
      });
    }
    if (room.password !== msg.password) {
      socket.emit("$Error", {
        code: 10001,
        detail: "房间密码错误",
      });
    }
    logger.info(`角色 ${name}·${server} 加入 ${msg.roomId} 房间。`);
    $当前状态(socket, {
      状态: 状态类型.房间中,
      数据: {
        id,
        teamTypes,
        clientTypes,
        members: [
          {
            zoneName: "电信区",
            roleName: "花间游不动",
            serverName: "唯我独尊",
            kungfuId: "10028",
            panelList: { score: 466666, panel: [] },
          },
        ],
        isOwner: false,
      },
    });
  });

  socket.on(客户端事件.房间中_开始匹配, (msg) => {});
  socket.on(客户端事件.房间中_退出房间, (msg) => {});
  socket.on(客户端事件.匹配成功_确认, (msg) => {});
  socket.on(客户端事件.匹配成功_取消, (msg) => {});
  socket.on(客户端事件.队伍中_发送消息, (msg) => {});
});

logger.info("Socket.IO 服务在端口13000上运行。");
