(function() {
    /**
     * Command Builder
     */
    Commands = function() {
    }

    Commands.__formats = {};

    /**
     * Create (and format) a command using built-in templates.
     */
    Commands.create = function(action, metadata) {
        try {
            var message = Commands.__formats[action](action, metadata);
            return JSON.stringify(message);
        }
        catch (e) {
            console.log(e);
        }
        return '';
    }

    /**
     * Connect to the server.
     *
     * The following fields in metadata are used:
     *      username: current user
     *      token: authenticated token (e.g. session-id)
     */
    Commands.CONNECT = 'connect';
    Commands.__formats[Commands.CONNECT] = function(action, metadata) {
        return {
            action: action,
            params: {
                username: metadata.username,
                token: metadata.token
            }
        };
    }

    /**
     * Request to change the online status.
     *
     * The following fields in metadata are used:
     *      status: online status to be set
     */
    Commands.STATUS = 'status';
    Commands.__formats[Commands.STATUS] = function(action, metadata) {
        return {
            action: action,
            params: {
                status: metadata.status
            }
        };
    }

    /**
     * Send a message to a channel.
     *
     * The following fields in metadata are used:
     *      channel: channel to be received the message
     *      message: message to be delivered
     */
    Commands.MESSAGE = 'message';
    Commands.__formats[Commands.MESSAGE] = function(action, metadata) {
        return {
            action: action,
            params: {
                channel: metadata.channel,
                msg: metadata.message
            }
        };
    }

    /**
     * Request to join a channel (and start to receive updates
     * from this channel).
     *
     * The following fields in metadata are used:
     *      channel: channel to be joined
     */
    Commands.JOIN = 'join';
    Commands.__formats[Commands.JOIN] = function(action, metadata) {
        return {
            action: action,
            params: {
                channel: metadata.channel
            }
        };
    }

    /**
     * Request to leave a channel. The user won't receive any update
     * from this channel again.
     *
     * The following fields in metadata are used:
     *      session: the session is being updated
     *      channel: channel is being received the message
     * See Commands.JOIN
     */
    Commands.LEAVE = 'leave';
    Commands.__formats[Commands.LEAVE] = Commands.__formats[Commands.JOIN];

    /**
     * List all available channels to be joined.
     *
     * The following fields in metadata are used:
     *      channels: channels to be listed. If this field is empty, all
     *          available channels will be returned.
     *
     * The output will have the following format:
     *      channels:
     *          [
     *              {id: "global", name: "Global", creator: "system", ...},
     *              {id: "hell", name: "Hell", creator: "instcode", ...},
     *              {id: "paradise", name: "Paradise", creator: "none", ...}
     *          ]
     */
    Commands.LIST = 'list';
    Commands.__formats[Commands.LIST] = function(action, metadata) {
        return {
            action: action,
            params: {}
        };
    }

    /**
     * Request to create a new channel.
     *
     * The following fields in metadata are used:
     *      message: initial message to be sent when creating the channel
     *      options: the settings of the being created channel
     */
    Commands.CREATE = 'create';
    Commands.__formats[Commands.CREATE] = function(action, metadata) {
        return {
            action: action,
            params: {
                type: metadata.type,
                options: metadata.options
            }
        };
    }

    /**
     * Request to update channel settings.
     *
     * The following fields in metadata are used:
     *      channel: channel is being received the message
     *      options: the to be modified settings the channel
     */
    Commands.UPDATE = 'update';
    Commands.__formats[Commands.UPDATE] = function(action, metadata) {
        return {
            action: action,
            params: {
                channel: metadata.channel,
                options: metadata.options
            }
        };
    }

    /**
     * Request to delete the channel (only owner or super user can
     * do this).
     *
     * The following fields in metadata are used:
     *      channel: channel is being received the message
     *      message: a reason why the channel was deleted
     */
    Commands.DELETE = 'delete';
    Commands.__formats[Commands.DELETE] = function(action, metadata) {
        return {
            action: action,
            params: {
                channel: metadata.channel,
                reason: metadata.message
            }
        };
    }

    /**
     * @param {string} url
     * @param {string} client
     */
    NJMC = function(server, user) {
        NJMC.self = this;
        this.server = server;
        this.state = NJMC.CONNECTING;
        this.user = user;
        this.__events = {};
    }

    /**
     * @param {string} data The command to send to the server.
     * @return {boolean}  True for success, false for failure.
     */
    NJMC.prototype.send = function(command, params) {
        if (this.state == NJMC.CONNECTING) {
            throw "The connection hasn't been established.";
        }
        var command = Commands.create(command, params);
        if (command !== '') {
            return NJMC.__ws.send(command);
        }
        return false;
    }

    /**
     * Close connection 
     */
    NJMC.prototype.close = function() {
        if (this.state == NJMC.CLOSED || this.state == NJMC.CLOSING) {
            return;
        }
        this.state = NJMC.CLOSING;
        NJMC.__ws.close();
    }

    /**
     * @param {string} action
     * @param {function} listener
     * @return void
     */
    NJMC.prototype.addEventListener = function(action, listener) {
        if (!(action in this.__events)) {
            this.__events[action] = [];
        }
        this.__events[action].push(listener);
    }

    /**
     * @param {string} action
     * @param {function} listener
     * @return void
     */
    NJMC.prototype.removeEventListener = function(action, listener) {
        if (!(action in this.__events)) return;
        var events = this.__events[action];
        for (var i = events.length - 1; i >= 0; --i) {
            if (events[i] === listener) {
                events.splice(i, 1);
                break;
            }
        }
    }

    /**
     * @param {Event} event
     * @return void
     */
    NJMC.prototype.dispatchEvent = function(event) {
        console.log(event);
        var events = this.__events[event.type] || [];
        for (var i = 0; i < events.length; ++i) {
            events[i](event);
        }
        var handler = this["on" + event.type];

        if (handler) handler(event);
    }

    NJMC.createEvent = function(event) {
        try {
            console.log(event.data);
            var njmcEvent = JSON.parse(event.data);
            return njmcEvent;
        }
        catch (e) {
            console.log(e);
        }
        return {type: "", data: ""};
    }

    /**
     * Define the NJMC state enumeration.
     */
    NJMC.CONNECTING = 0;
    NJMC.READY = 1;
    NJMC.CLOSING = 2;
    NJMC.CLOSED = 3;

    NJMC.initialize = function() {
        if (WebSocket.__initialize !== undefined) {
            WebSocket.__initialize();
        };
		
        NJMC.__ws = new WebSocket('ws://' + NJMC.self.server);

        NJMC.__ws.onopen = function(event) {
            var command = Commands.create(Commands.CONNECT,
                    {username: NJMC.self.user.username, token: NJMC.self.user.authToken});
            NJMC.__ws.send(command);
        };

        NJMC.__ws.onmessage = function(event) {
            var event = NJMC.createEvent(event);
            if (event.type === Commands.CONNECT && event.data.error == 0) {
                NJMC.self.state = NJMC.READY;
            }
            NJMC.self.dispatchEvent(event);
		};

        NJMC.__ws.onclose = function(event) {
            NJMC.self.state = NJMC.CLOSED;
            event.data = '{"type":"closed","data":{"by":"njmc"}}';
            NJMC.self.dispatchEvent(NJMC.createEvent(event));
        };

        NJMC.__ws.onerror = function(event) {
            console.error('Error.');
        };
    }

})();

var Presence = {
    ONLINE : 0,
    OFFLINE : 1
};

var Channel = {
    Type: {
        ROOM : 0,
        PRIVATE : 1
    },
    Mode: {
        PUBLIC: 0,
        PRIVATE: 1
    }
}

