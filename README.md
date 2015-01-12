# Pointrel20150110 by Paul Fernhout, MIT license

The intent of this version of the Pointrel system was to have a quick-and-dirty experimental command line version of a triple store inspired by the MH (mail handling) concept, where you could use standard shell operations alongside command to create and find Pointrel triples. I made an initial version in Node.js. So, with the proper aliasing, you could issue shell commands like: "$ pointrel add a b c".

I rapidly realized it would be nice to also have a server version so you access the content via a web browser. So, I added that also using Node.js to the same JavaScript file (adding a "pointrel server" command). 

Then I added a test file to add triples from the browser, which interacted with extra server functions to add a triple or to list things.

## Useful things to know for command line use:

For bash on Mac to get an alias for a "pointrel" command (replace $YOUR_USERID$ with your user ID):

  alias pointrel="node /Users/$YOUR_USERID$/pointrel_command/pointrel.js"

You can list the first item of all triples with:

  $ pointrel list

You can list the second (b, or relationship) part of triples for a first (a) part with:

  $ pointrel list $THE_ITEM$

You can list all the third (c, or value) part of triples for the a and b parts with:

  $ pointrel list $THE_ITEM$ $THE_RELATIONSHIP$

You can also "find" the last value for an item with (note the underscore "_", which is optional at the end, and can e used in any of the three fields) :

  $ pointrel find $THE_ITEM$ $THE_RELATIONSHIP$ _

You can find all the matches for something, which lists the file ID something is in with:

  $ pointrel findall $THE_ITEM$ $THE_RELATIONSHIP$ _

  $ pointrel findall _ $THE_RELATIONSHIP$ $THE_VALUE_

You can delete previously added relationships if you know their timestamp ID (from the previous command, or from inspecting the files under the resources directory) with the delete command:

  $ pointrel delete $SOME_TIMESTAMP_ID$

## Useful things to know for web server use:

To get the webserver running in the background to use the pages:

  $ pointrel server &

To add web pages fr display, create a triple like so (replace $PAGE_NAME$ with your page name):

  $ pointrel add page:$PAGE_NAME$ content 'Your page content...'

You can also specify a contentType if it is not the default "text/plain" like so:

  $ pointrel add page:$PAGE_NAME$ contentType 'text/html'

  $ pointrel add page:$PAGE_NAME$ contentType 'application/javascript'

As an example, to add the content for a bootstrap page running as "http://localhost:8000/test.html" using bash in the project directory:

  $ pointrel add page:test.html contentType "text/html"
  $ pointrel add page:test.html content "$(< add_test.html)"

That bootstrap file supports defining new triples, so you can define new pages or even upgrade the bootstrap page itself. You can add web content files with any extension or none at all, but you need to set the content type appropriately for non-text files. You can specify arbitrary paths with slashes in them. You can add JavaScript files to make complex apps (but you should set the contentType for them). You can store data back to the server as a new triple using a POST command from JavaScript (see add_test.html for an example). There may be a short delay (currently up to one second) before the webserver picks up changes.

## Screenshots from updating the README.txt file (before if became README.md to include the screenshots):

![Pointrel20150110-screenshot-adding-README-content-via-web-interface.png](/screenshots/Pointrel20150110-screenshot-adding-README-content-via-web-interface.png?raw=true "Optional Title")

![Pointrel20150110-screenshot-viewing-README-content-via-web-interface.png](/screenshots/Pointrel20150110-screenshot-viewing-README-content-via-web-interface.png?raw=true "Optional Title")

