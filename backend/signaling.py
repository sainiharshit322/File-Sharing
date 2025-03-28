from flask_socketio import SocketIO
from flask_socketio import request, emit
socketio = SocketIO(cors_allowed_origins="*")

clients = {}

@socketio.on("connect")
def connect():
    print("Client connected!")

@socketio.on("register")
def register(data):
    peer_id = data["peer_id"]
    clients[peer_id] = request.sid
    print(f"Peer {peer_id} registered.")

@socketio.on("signal")
def signal(data):
    target = data["target"]
    if target in clients:
        emit("signal", data, room=clients[target])

if __name__ == "__main__":
    socketio.run(host="0.0.0.0", port=5001, debug=True)
