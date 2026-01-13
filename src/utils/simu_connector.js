/**
 * @typedef {{
 *     eventHandlers: Object.<string, function(any): void>,
 *     onClose: function(): void,
 *     onStartConnect: function(): void,
 *     onOpen: function(): void
 * }} SimuConnectionConfig
 */

/**
 * @typedef {{
 *     emitClose: function(): void,
 *     emitBroadcast: function(event: string, data: any): void
 * }} SimuConnectionSession
 */

/**
 *
 * @param {SimuConnectionConfig} config
 * @param {string} host
 * @param {number} port
 * @return {SimuConnectionSession}
 */
function connect(
    config,
    host = "localhost",
    port = 7642
) {
    const socket = new WebSocket(`ws://${host}:${port}`);

    socket.addEventListener("open", config.onOpen);

    socket.addEventListener("message", (event) => {
        const eventBody = JSON.parse(event.data);
        if (eventBody.event) {
            const handler = config.eventHandlers[eventBody.event]
            if (handler instanceof Function){
                handler(eventBody.data)
            }
        }
    });

    socket.addEventListener("close", config.onClose);

    config.onStartConnect();

    return {
        emitClose() {
            socket.close()
        },
        emitBroadcast(event, data) {
            if (socket) socket.send(JSON.stringify({event, data}));
        }
    }
}

export default connect;