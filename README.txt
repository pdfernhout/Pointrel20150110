Pointrel20150110 by Paul Fernhout

The intent of this version of the Pointrel system was to have a quick-and-dirty experimental command line version inspired by the MH (mail handling) concept, where you could use standard shell operations alongside Pointrel triples. I made an initial version in Node.js. So you could issue commands like (with the proper aliases) "pointrel add a b c").

I rapidly realized it would be nice to also have a server version so you access the content via a web browser. So, I added that also using Node.js to the same JavaScript file (adding a "pointrel server" command). 

Then I added a test file to add triples from the browser, which interacted with extra server functions to add a triple or to list things.

==== Useful things to know:

For bash on Mac (replace $YOUR_USERID$ with your user ID):

  alias pointrel="node /Users/$YOUR_USERID$/pointrel_command/pointrel.js"

To get web pages displayed, create a triple with (replace $PAGE_NAME$ with your page name):

  $ pointrel add page:$PAGE_NAME$ content 'Your page content...'

You can also specify a contentType if it is not the default "text/plain" like so:

  $ pointrel add page:$PAGE_NAME$ contentType 'text/html'

  $ pointrel add page:$PAGE_NAME$ contentType 'application/javascript'

To get the bootstrap page running as "http://localhost:8000/test.html" using bash in the project directory:

  $ pointrel add page:test.html contentType "text/html"
  $ pointrel add page:test.html content "$(< add_test.html)"

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


