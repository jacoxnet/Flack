# Project 2

Web Programming with Python and JavaScript

## CX Flack

This project was prepared to satisfy project2 in the online version fo this class.

## Introduction

**CX Flack** is a web application that allows users to chat with each other in different chat rooms or **channels**. The basic functions of the program are:

- *Sign in*. The user can sign in with any name she chooses, and can also choose an initial channel to start with. The local app remembers the last sign in and channel and will display those if available.

- *Chat*. The user can type in messages in the text box on the top, and those messages are recorded in the larger chat box below.

- *Channels*. Available channels are displayed in the sidebar on the chat page. The user can change channels by clicking on them. The user can also create a new channel by typing its name in the input box on the sidebar.

These pages, how they are implemented, and how they are to be used, are all described in more detail below.

## Technologies

The web app is implemented principally using Flask, Flask-SocketIO, and python3. The communication between the server and the client while the client is on the chat page is all done through socketio.

## Data Structure

The class specification did not permit use of a database to store channels or chat transcripts, so the app uses a global variable, ChatData, to hold that information at least as long as the app is running.

```python
# ChatData {}
# this is a global multi-level dict containing all of the chat data
# {"channel1": {"users": ({"user1", "user2", ...}), "posts": [post1, post2, ... ]},
#  "channel2": { ... }}
#   the "users" value is a set of usernames
#   the "posts" value is a list of posts
#   posts, in turn, are dicts with four keys:
#       {"name": username, "time": timestamp, "channel": channel, "content": text of post}
```

## How to use

The web app is started by typing:

```shell
$ python3 application.py
```

in the project directory.

### Files

- application.py (main repository of python code)
- requirements.txt
- templates directory
  - chat.html
  - layout.html
  - signin.html
  - signout.html
- static
  - chat.js   (javascript code for chat page)
  - styles.css
  - favicon.ico

## Instructions for Using

### Signin Page

This page includes the CX-FLACK sidebar and two input boxes with the placeholders for `username` and `channel`. If desired, a new user types in her chosen username and channel. If nothing is entered, the default username is `flack-user` and the default channel is `#general discussion`. For convenience, the app includes six pre-chosen channels (`general discussion`, `cs50x`, `projects`, `python`, `sql`, and `javascript`.

If the user types in a new channel name on the signin page, it is created and the user switched to it on the chat page.

Using `localStorage` in javascript run by the browser, the app is coded to remember the most recent username and channel from that browser and location, even if the browser is closed. If remembered values are available, they are pre-loaded in the input fields and on signin the user is taken to the remembered channel.

### Chat Page

The chat page is the main functional page of the app. This page is not reloaded, but provides new information through `socketio` communications. It includes:

- A sidebar listing the current user, the number of active users, the current channel, the names of available channels, and an input box to add a new channel. There is also a "Sign out" button that can be clicked.
- An input box for a "New Post" at the top of the main part of the page, below another indicator of the current channel. When a new post is entered, the user can either press Enter or click the Send button.
- A chat transcript box in which posts from users in the channel are displayed. If a user switches into a channel with available server-stored posts, they are retrieved and displayed.
- just below the transcript box, a listing of all users "in room" (i.e. who are active and tuned to this channel).

### Signout Page

- This page identifies the user who just signed out, and offers a clickable area to Sign In Again.

## Requirements

The app satisfies the requirements set forth in the Project2 class specification. In addition, the app includes as a "personal touch" additional functionality keeping track of and dynamically displaying the number of active users and the names of all users in the currently selected channel.
