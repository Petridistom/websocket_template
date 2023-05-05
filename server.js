import { serve }    from "https://deno.land/std@0.185.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.185.0/http/file_server.ts"
import { generate } from "https://deno.land/std@0.185.0/uuid/v1.ts"

// use the handler function to 
// manage requests on port 80
serve (handler, { port: 80 })

// initialise an empty map
// to manage sockets
const sockets = new Map ()

// define the request handler function
function handler (incoming_req) {

   // assign request to mutable variable
   let req = incoming_req

   // get the value of the upgrade header on the request
   // or an empty string if the value is falsy
   const upgrade = req.headers.get ("upgrade") || ""

   // check if it is an upgrade request
   if (upgrade.toLowerCase() == "websocket") {

      // unwrap socket and response variables from req
      const { socket, response } = Deno.upgradeWebSocket (req)

      // when a socket is opened
      socket.onopen  = () => {

         // print message to console
         console.log (`server: websocket opened!`)

         // generate a unique ID
         const id = generate ()

         // pair socket with ID
         // & add to sockets map
         sockets.set (id, socket)

         // make a msg object
         // with method and content
         const msg = { 
            'method'  : `id`,
            'content' : id,
         }

         // stringify the msg & 
         // send it through the socket
         socket.send (JSON.stringify (msg))

      }

      // call check_sockets when a socket is closed
      socket.onclose = () => check_sockets ()

      // print errors to console
      socket.onerror = e => console.dir (e)

      // when recieving a message
      // from a socket
      socket.onmessage = e => {

         // unstringify the message
         const msg = JSON.parse (e.data)

         // object literal to manage
         // incoming messages
         // each method of the object
         // correlates to a method property
         // on the transmitted msg
         const manage_incoming = {

            // manage `click_location` msgs
            click_location: () => {

               // make a new msg
               const new_msg = {

                  // this time with add_square
                  // as its method
                  method  : `add_square`,

                  // but replicating the same
                  // content as the original msg
                  content : msg.content
               }

               // stringify the new msg and send to all sockets
               sockets.forEach (s => s.send (JSON.stringify (new_msg)))
            }
         }
      
         // use the .method property of the msg 
         // to select which method to call
         manage_incoming[msg.method] ()
      }
      
      // return the websocket handshake
      return response
   }

   // if the url does not 
   // specify a filename
   if (req.url.endsWith (`/`)) {

      // add 'index.html' to the url
      req = new Request (`${ req.url }index.html`, req)
   }

   // construct options object
   // using object literal syntax
   const options = {

      // route requests to this
      // directory in the file system
      fsRoot: `public`
   }

   // return the requested asset
   // from `public` folder
   return serveDir (req, options)
}

// defines a function which checks for closed sockets
function check_sockets () {

   // empty array for the IDs of closed sockets
   const removals = []

   // go through sockets
   sockets.forEach ((s, id) => {

      // if it is closed or closing,
      // push its ID to removals array
      if (s.readyState > 1) removals.push (id)
   })

   // if there is anything in the removals array
   if (removals.length) removals.forEach (id => {

      // delete it from the sockets map
      sockets.delete (id)
   })

}
