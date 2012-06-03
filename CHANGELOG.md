v0.0.5
------
+ Initial release

v0.0.6
------
+ You can now supply a skip: [] parameter to the queue constructor as a basic way to omit tasks by type.
+ You can now supply a defaults object which will act as a default set of parameters for tasks
which have them omitted (parameters are not merged with user supplied parameters at the moment).

v0.0.7
------
+ Fixed a bug where forked queues would not inherit the task skip list or the task defaults.

v0.0.8
------
+ Replaced file globbing to add win32 support
+ Restructure of the entire file copy system, *NOTE*: task 'copy' now respects whether a trailing slash appears in the
source path. Without the slash; the source directory will be copied as a child of the destination. With a trailing
slash; the contents of the source directory are copied to the destination.
+ Decided that State returning an object with multiple keys, and setting the state being two completely different looking
API's was a bit strange. Unified state into a more simplistic and hopefully more intuitive API.
+ Custom task exports now declare the types of content they will accept, reducing the boilerplate required in each type
to check if the content is not supported by the task.
