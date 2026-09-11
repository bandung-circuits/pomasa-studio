responsible for the events transmission of
background, and maintain the tree of 
services to be triggered meanwhile.

For example, if a file system writes a file,
it will trigger the event of this action.
Files like config write should trigger the action
of refreshing frontend.

responsible for the communication 
with service of frontend(client)

packaging methods of client services and http/websocket.
So that background can use them as a local function.