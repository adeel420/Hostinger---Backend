const axios = require("axios");

const whmcsConfig = {
  url: process.env.WHMCS_URL,
  identifier: process.env.WHMCS_IDENTIFIER,
  secret: process.env.WHMCS_SECRET,
};

// WHMCS API call helper
const whmcsAPI = async (action, params) => {
  try {
    const response = await axios.post(`${whmcsConfig.url}/includes/api.php`, null, {
      params: {
        action,
        identifier: whmcsConfig.identifier,
        secret: whmcsConfig.secret,
        responsetype: "json",
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`WHMCS API Error: ${error.message}`);
  }
};

// Create WHMCS client
const createWHMCSClient = async (userData) => {
  return await whmcsAPI("AddClient", {
    firstname: userData.firstName,
    lastname: userData.lastName,
    email: userData.email,
    address1: userData.address,
    city: userData.city,
    state: userData.state,
    postcode: userData.postcode,
    country: userData.country,
    phonenumber: userData.phone,
    password2: Math.random().toString(36).slice(-8),
  });
};

// Create WHMCS order for hosting
const createWHMCSHostingOrder = async (clientId, productId, domain) => {
  return await whmcsAPI("AddOrder", {
    clientid: clientId,
    pid: productId,
    domain: domain,
    billingcycle: "monthly",
    paymentmethod: "banktransfer",
  });
};

// Register domain in WHMCS
const registerWHMCSDomain = async (clientId, domain, tld) => {
  return await whmcsAPI("DomainRegister", {
    clientid: clientId,
    domain: `${domain}${tld}`,
    regperiod: 1,
  });
};

// Accept order (mark as paid)
const acceptWHMCSOrder = async (orderId) => {
  return await whmcsAPI("AcceptOrder", {
    orderid: orderId,
  });
};

module.exports = {
  createWHMCSClient,
  createWHMCSHostingOrder,
  registerWHMCSDomain,
  acceptWHMCSOrder,
};
