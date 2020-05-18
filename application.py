import time, os, requests, json
from datetime import datetime
from copy import deepcopy

from flask import Flask, url_for, render_template, request, session, redirect
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = 'abcdef$'
socketio = SocketIO(app)

# global variables 
# 
# list of posts - each post will be a dict with "name", "channel", "time" and "content"
all_posts = []

INITIAL_CHANNELS = ["general discussion", "cs50x", "projects", "python", "sql", "javascript"]

# this is a global two-level dict containing all of the chat data
# {"channel1": {"users": ({"user1", "user2", "user3"}), "posts": [post1, post2, ... ]}}
#   the "users" value is a set of usernames
#   the "posts" value is a list of posts
#   posts, in turn, are dicts with four keys:
#       {"name": username, "time": timestamp, "channel": channel, "content": text of post}

ChatData = {}
EmptyChannel = {"users": set(), "posts": []}
# initialize variable by assigning empty set for users and empty list for posts
for c in INITIAL_CHANNELS:
    ChatData[c] = deepcopy(EmptyChannel)

@app.route("/", methods=['GET', 'POST'])
def signin():
    """ Sign in and enter a channel (room)
        Store the name and initial channel in session
    """
    if request.method == 'POST':
        # name and channel should be in form
        name = request.form.get("name")
        channel = request.form.get("channel")
        # if not, create default values
        if not name:
            name = "flack-user"
        if not channel:
            channel = "general discussion"
        # store name and (initial) channel in session
        # note that session channel will become inaccurate because
        # main session cannot be changed in socketio session
        session["name"] = name
        session["channel"] = channel
        # create channel entry if new channel
        if channel not in ChatData.keys():
            ChatData[channel] = deepcopy(EmptyChannel)
        # store name and (initial) channel in var
        ChatData[channel]['users'].add(name)
        # send out new list of channels (not for this client 
        # since it is not on chat page but for others)
        broadcast_num_users()
        broadcast_channels()
        return redirect(url_for("chat"))
    else:
        # method must be GET - sign in page
        return render_template("signin.html")

@app.route("/chat")
def chat():
    """ Main chat room page. Arrive there through
        sign in
    """
    # retrieve session name and channel
    name = session.get("name")
    channel = session.get("channel")
    return render_template("chat.html", name=name, channel=channel)

@app.route("/signout")
def signout():
    # delete user from all channels
    name = session.get("name")
    for k in ChatData.keys():
        ChatData[k]["users"].discard(name)
    session.clear()
    return render_template("signout.html")

def broadcast_channels():
    """ broadcasts channels to all 
    """
    socketio.emit("update channels", list(ChatData.keys()), broadcast=True)

def broadcast_num_users():
    """ broadcasts num_users to all 
    """
    s = set()
    # create a set of unions of all channel users to determine num_users
    for k in ChatData.keys():
        s = s.union(ChatData[k]["users"])
    socketio.emit("update num_users", {"num_users": len(s)}, broadcast=True)

def send_old_posts(channel):
    """ send old posts for channel
    """
    print("sending old posts", channel, ChatData[channel]["posts"])
    socketio.emit("send old posts", {"channel": channel, "posts": ChatData[channel]["posts"]}, room=channel)

def send_status(name, channel, msg):
    """ send status msg (left or joined)
    """
    m1 = name + " " + msg
    m2 = "In room: " + ", ".join(ChatData[channel]["users"])
    emit("status", {"content": m1, "users": m2, "channel": channel}, room=channel)

@socketio.on("leave")
def leave(data):
    """ sent by client when user leaves a channel 
    """
    ChatData[data["channel"]]["users"].discard(session.get("name"))
    send_status(session.get("name"), data["channel"], "left")

@socketio.on("join")
def join(data):
    """ sent by client when user joins a channel
    """
    session["channel"] = data["channel"]
    join_room(data["channel"])
    if data["channel"] not in ChatData.keys():
        ChatData[data["channel"]] = deepcopy(EmptyChannel)
    ChatData[data["channel"]]["users"].add(session.get("name"))
    send_old_posts(data["channel"])
    send_status(session.get("name"), data["channel"], "joined")
    broadcast_num_users()
    broadcast_channels()

@socketio.on("proffer")
def proffer_post(data):
    # add timestamp
    data["time"] = datetime.now().strftime("%b %-d, %Y %-I:%M %p")
    # add to server list
    ChatData[data["channel"]]["posts"].append(data)
    # allow only 100 posts in each channel
    if len(ChatData[data["channel"]]["posts"]) > 100:
        ChatData[data["channel"]]["posts"].pop(0)
    emit("distribute", data, room=data["channel"])

@socketio.on("disconnect")
def disconnect():
    broadcast_num_users()
    return redirect("/signout")

if __name__ == "__main__":
    socketio.run(app)
