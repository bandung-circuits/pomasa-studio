UI + data modle

inherit from right bar

send the actions of start task, stop current task, stop all tasks.

accept the events of start all tasks, stop current task, stop all tasks.

accept the event of selecting a agent(to stop a current task).

Since other components, for example chats can stop the agent either.
So it should be controlled by actions system.

if running, stop current task, stop all tasks is activated. 
if stoped, start all tasks is activated.

run and stop will be sent to background.