import { buildUrl } from './utils';
const request = require('request');
const queue = require('async/queue');

/**
 * Commands that can be run on the Status app.
 */
class StatusApi {
  constructor({ protocol, deviceIp, port, logger, timeout }) {
    this.url = buildUrl(protocol, deviceIp, port);
    this.logger = logger;
    this.timeout = timeout;
    this.queue = queue(function (task, cb) {
      request(task.url, task.options, (err, resp, body) => {
        // TODO: remove this setTimeout - it is a workaround for the
        // Status HTTP server not responding to simulataneous requests
        setTimeout(() => { cb(err, resp, body); }, 250);
      });
    }, 1);
  }

  /**
   * Sends a request with a JSON body to the Status app.
   * 
   * @param {String} endpoint Specifies the command sent to the Staus app.
   * @param {Object} body JSON data sent with the request.
   * @param {String} method HTTP method for the reqeust. Valid options are "POST" and "DELETE".
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app.
   * 
   * @returns {void}
   */
  _request(endpoint, body, method, cb) {
    this.queue.push({
      url: this.url + endpoint,
      options: {
        method: method,
        timeout: this.timeout,
        json: true,
        body: body
      }
    }, (error, _response, respBody) => {
      this.logger.trace(`REQUEST: ${endpoint} ${JSON.stringify(body)}\nRESPONSE: ${JSON.stringify(respBody)}\nERROR: ${error}`);
      cb(error, respBody);
    });
  }

  /**
   * Pings the Status app.
   * Expected response: {"message": "Pong!"}
   * Equivalent to: POST http://<device_ip>:5561/ping
   * 
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Boolean} True if ping was successful and returned {"message": "Pong!"}.
   * 
   * @returns {void}
   */
  ping(cb) {
    this._request('/ping', {}, "POST", (err, body) => {
      if (err) return cb(err);
      if (!body || body === '') return cb('No ping response');
      cb(err, true);
    });
  }

  /**
   * Opens URL in the Status browser.
   * Expected response: { "message": "URL has been opened." }
   * Equivalent to: POST http://<device_ip>:5561/dapp/open url=<dapp_url>
   * 
   * @param {String} url URL to open in the Status browser.
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app.
   * 
   * @returns {void}
   */
  openDapp(url, cb) {
    this._request('/dapp/open', { url: url }, "POST", cb);
  }

  /**
   * Adds a network to the Status app.
   * Example response (success): { "message": "Network has been added.", "network-id": "1535660846036b3c3241022ec5046af53cdb769dcc216" }
   * Example response (fail): { "message": "Please, check the validity of network information." }
   * Equivalent to: POST http://<device_ip>:5561/network name=AnyNetworkName url=http://localhost:3000 chain=mainnet network-id=2
   * 
   * @param {String} name Display name of the network.
   * @param {String} nodeUrl URL of the node to connect to.
   * @param {String} chainName Name of the chain.
   * @param {Number} networkId ID of the network.
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app.
   * 
   * @returns {void}
   */
  addNetwork(name, nodeUrl, chainName, networkId, cb) {
    this._request('/network', { name: name, url: nodeUrl, chain: chainName, "network-id": networkId }, "POST", cb);
  }

  /**
   * Connects the Status app to an existing network.
   * Example response (success): { "message": "Network has been connected.", "network-id": "1535660846036b3c3241022ec5046af53cdb769dcc216" }
   * Example response (fail): { "message": "The network id you provided doesn't exist." }
   * Equivalent to: POST http://<device_ip>:5561/network/connect id=1535660846036b3c3241022ec5046af53cdb769dcc216
   * 
   * @param {String} id Status network ID to connect to.
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app.
   * 
   * @returns {void}
   */
  connect(id, cb) {
    this._request('/network/connect', { id: id }, "POST", cb);
  }

  /**
   * Removes a network from the Status app.
   * Example response (success): { "message": "Network has been deleted.", "network-id": "1535660846036b3c3241022ec5046af53cdb769dcc216" }
   * Example response (fail): { "message": "Cannot delete the provided network." }
   * Equivalent to: DELETE http://<device_ip>:5561/network id=1535660846036b3c3241022ec5046af53cdb769dcc216
   * 
   * @param {String} id Status network ID to remove.
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app.
   * 
   * @returns {void}
   */
  removeNetwork(id, cb) {
    this._request('/network', { id: id }, "DELETE", cb);
  }

  /**
   * Lists all networks in the Status app.
   * Example response (success): { "message": "Network has been deleted.", "network-id": "1535660846036b3c3241022ec5046af53cdb769dcc216" }
   * Example response (fail): { "message": "Cannot delete the provided network." }
   * Equivalent to: GET http://<device_ip>:5561/networks
   * 
   * @param {Function} cb Callback called upon response, called with parameters:
   *  - {Error} Error that occurred during request.
   *  - {Object} JSON response from the Status app containing an Object with networks.
   * 
   * @returns {void}
   */
  networks(cb) {
    this._request('/networks', {}, "GET", cb);
  }
}

export default StatusApi;
