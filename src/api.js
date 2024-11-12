const jx3api = require("jx3api");

//API接口
const api = new jx3api.api({
  token: process.env.JX3API_TOKEN,
  ticket: process.env.TUILAN_TICKET,
});

async function getRoleAttribute({ server, name }) {
  // return (await api.role_attribute(server, name))?.data;
  return {
    zoneName: "",
    roleName: name,
    serverName: server,
    kungfuId: "10028",
    panelList: { score: 466666, panel: [] },
  };
}

//WS推送消息
// const ws = new jx3api.ws({ token: process.env.JX3API_TOKEN });

module.exports = { getRoleAttribute };
