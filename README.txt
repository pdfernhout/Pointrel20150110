Pointrel20150110 by Paul Fernhout

The intent of this version of the Pointrel system was to have a quick-and-dirty experimental command line version inspired by the MH (mail handling) concept, where you could use standard shell operations alongside Pointrel triples. I made an initial version in Node.js. So you could issue commands like (with the proper aliases) "pointrel add a b c").

I rapidly realized it would be nice to also have a server version so you access the content via a web browser. So, I added that also using Node.js to the same JavaScript file (adding a "pointrel server" command). 

Then I added a test file to add triples from the browser, which interacted with extra server functions to add a triple or to list things.

