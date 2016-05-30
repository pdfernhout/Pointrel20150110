## Pointrel20150110 by Paul Fernhout

The intent of this version of the Pointrel system was to have a quick-and-dirty experimental command line version of a triple store inspired by the MH (mail handling) concept, where you could use standard shell operations alongside command to create and find Pointrel triples. I made an initial version in Node.js. So, with the proper aliasing, you could issue shell commands like: "$ pointrel add a b c".

I rapidly realized it would be nice to also have a server version so you access the content via a web browser. So, I added that also using Node.js to the same JavaScript file (adding a "pointrel server" command). 

Then I added a test file to add triples from the browser, which interacted with extra server functions to add a triple or to list things.

License: MIT license

### Useful things to know for command line use:

For a shorthand command in bash to use "p" instead of "pointrel", add this to a "p" file in ~/bin and make it executable (adjust for where you copied Pointrel20150110 or where node is installed):

    #!/bin/bash
    /usr/bin/node ~/Pointrel20150110/pointrel.js "$@"

You can list the first item of all triples with:

    $ pointrel list

You can list the second (b, or relationship) part of triples for a first (a) part with:

    $ pointrel list $ITEM

You can list all the third (c, or value) part of triples for the a and b parts with:

    $ pointrel list $ITEM $RELATIONSHIP

You can also "find" the last value for an item with (note the underscore "_", which is optional at the end, and can be used in any of the three fields) :

    $ pointrel find $ITEM $RELATIONSHIP _

You can find all the matches for something, which lists the file ID something is in with:

    $ pointrel findall $ITEM $RELATIONSHIP _

    $ pointrel findall _ $RELATIONSHIP $VALUE

You can delete previously added relationships if you know their timestamp ID (from the previous command, or from inspecting the files under the resources directory) with the delete command:

    $ pointrel delete $SOME_TIMESTAMP_ID

### Screenshot of using Pointrel command line to add a "thought"

![Pointrel20150110 screenshot of command line interactions to add a thought](/screenshots/Pointrel20150110-screenshot-command-line-interactions-to-add-a-thought.png?raw=true "Optional Title")

### Useful things to know for web server use:

To get the webserver running in the background to use the pages:

    $ pointrel server &

To add web pages fr display, create a triple like so (replace $PAGE_NAME with your page name):

    $ pointrel add page:$PAGE_NAME content 'Your page content...'

You can also specify a content-type if it is not the default "text/plain" like so:

    $ pointrel add page:$PAGE_NAME content-type 'text/html'

    $ pointrel add page:$PAGE_NAME content-type 'application/javascript'

As an example, to add the content for a bootstrap page running as "http://localhost:8000/test.html" using bash in the project directory:

    $ pointrel add page:test.html content-type "text/html"
    $ pointrel add page:test.html content "$(< demos/add_test.html)"

To load in an editor, try:

    $ pointrel add page:editor.html content-type "text/html"
    $ pointrel add page:editor.html content "$(< demos/editor.html)"
    $ pointrel add page:editor.js content-type "application/javascript"
    $ pointrel add page:editor.js content "$(< demos/editor.js)"

That bootstrap file supports defining new triples, so you can define new pages or even upgrade the bootstrap page itself. You can add web content files with any extension or none at all, but you need to set the content type appropriately for non-text files. You can specify arbitrary paths with slashes in them. You can add JavaScript files to make complex apps (but you should set the contentType for them). You can store data back to the server as a new triple using a POST command from JavaScript (see add_test.html for an example). There may be a short delay (currently up to one second) before the webserver picks up changes.

### Screenshots from updating the README.txt file (before if became README.md to include the screenshots):

![Pointrel20150110 screenshot adding README content via web interface](/screenshots/Pointrel20150110-screenshot-adding-README-content-via-web-interface.png?raw=true "Optional Title")

![Pointrel20150110 screenshot viewing README content via web interface](/screenshots/Pointrel20150110-screenshot-viewing-README-content-via-web-interface.png?raw=true "Optional Title")

