
// Connect to websocket
var socket;
// global_name and global_channel are initially passed by render_template
// and defined in script tag in html file


// store the current global_channel in the DOM & local storage
function set_channel(new_channel) {
    if (global_channel != new_channel) {
        console.log(`set_channel: moving from channel ${global_channel} to ${new_channel}`)
        socket.emit('leave', {'channel': global_channel});
        console.log(`set_channel: just left channel ${global_channel}`)
        // assign global variable and store in localstorage
        global_channel = new_channel;
        localStorage.setItem('channel', global_channel);
        /* store in DOM */
        document.querySelector('#channel').innerHTML = `#${global_channel}`;
        document.querySelector('#h_channel').innerHTML = `#${global_channel}`;
        // clear post box
        document.querySelector('#postbox').innerHTML = '';
        // tell server join new channel
        console.log('set_channel: cleared postbox');
        socket.emit('join', {'channel': global_channel});
        console.log(`set_channel: just joined channel ${global_channel}`)
    }
    return;
}

// scroll a div to the bottom
// (from stack overflow question 270612)
function scrollToBottom (t) {
    const d = document.querySelector(t);
    d.scrollTop = d.scrollHeight - d.clientHeight;
 }

// post a message in the postbox
function post_post(post) {
    let p = document.createElement('p');
    p.innerHTML = `${post.name} (${post.time}): ${post.content}`;
    p.setAttribute('class', 'post_content');
    document.querySelector('#postbox').append(p);
    return;
}

// post a status message in postbox
function post_status(msg) {
    let p = document.createElement('p');
    p.innerHTML = msg;
    p.setAttribute('class', 'post_status');
    document.querySelector('#postbox').append(p);
}

function sign_out() {
    socket.emit('leave', {'channel': global_channel});
    socket.disconnect();
    window.location.href = "/signout";
}

document.addEventListener('DOMContentLoaded', () => {
    
    // store global name and channel in DOM and local storage
    localStorage.setItem('name', global_name);
    localStorage.setItem('channel', global_channel);
    document.querySelector('#name').innerHTML = global_name;
    document.querySelector('#channel').innerHTML = `#${global_channel}`;
    document.querySelector('#h_channel').innerHTML = `#${global_channel}`;
    
    // connect socketio
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // When connected, perform tasks
    socket.on('connect', () => {
    
        // clear postbox
        document.querySelector('#postbox').innerHTML = '';
        // join first channel
        console.log(`on connect: joining first channel ${global_channel}`)
        socket.emit('join', {'channel': global_channel});
        
        // configure the Send New button to send a proffer post message
        document.querySelector('#sendnew').onclick = () => {
            // get the current text
            const new_text = document.querySelector('#newpost').value;
            // construct the post
            const new_post = {'name': global_name,
                             'channel': global_channel,
                             'content': new_text };
            // clear text box
            document.querySelector('#newpost').value = '';
            // send to server
            socket.emit('proffer', new_post);
            return false;
        };

        // configure text area to recognize return as click of Send New
        document.querySelector('#newpost').addEventListener('keyup', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.querySelector('#sendnew').click();
            }
        });

        // configure the Add Channel button to call set_channel (new channel)
        document.querySelector('#newchannelbutton').onclick = () => {
            set_channel(document.querySelector('#newchannel').value);
            // clear value of add channel box
            document.querySelector('#newchannel').value = '';
            return false;
        }

        // configure input box to recognize return as click of add channel button
        document.querySelector('#newchannel').addEventListener('keyup', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.querySelector('#newchannelbutton').click();
            }
        });
    });

    socket.on('distribute', post => {
        if (post.channel === global_channel) {
            post_post(post);
            scrollToBottom('#postbox');
        }
    });

    socket.on('status', post => {
        if (post.channel === global_channel) {
            post_status(post.content);
            scrollToBottom('#postbox');
            document.querySelector('#in_channel').innerHTML = post.users;
        }
    });

    socket.on('send old posts', data => {
        // take action only if nothing already in postbox
        console.log('on send old and update channel users:')
        console.log(`${data.posts.length} number of posts`)
        if (data.channel === global_channel) {
            if (document.querySelector('#postbox').innerHTML === '') {
                for (i = 0; i < data.posts.length; i++) {
                    post_post(data.posts[i]);
                }
                scrollToBottom('#postbox');
            }
        }
    });
    
    socket.on('update channels', all_channels => {
        //clear old channel list
        document.querySelector('#channel_list').innerHTML = '';
        // loop through channels setting onclick function to set_channel()
        for (i = 0; i < all_channels.length; i++) {
            let li = document.createElement('li');
            li.innerHTML = `#${all_channels[i]}`;
            li.setAttribute('class', 'sidelist');
            li.setAttribute('onclick', `set_channel('${all_channels[i]}')`);
            document.querySelector('#channel_list').append(li);
        }
    });

    socket.on('update num_users', data => {
        // update num_users in DOM
        document.querySelector('#num_users').innerHTML = `active users: ${data.num_users}`;
    });
});