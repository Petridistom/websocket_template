let id = false
let is_drawing = false
const squares = []

// const socket = new WebSocket (`ws://localhost/`)
const socket = new WebSocket (`wss://websocket-template.deno.dev//`)


socket.onopen  = () => console.log (`client: websocket opened!`)
socket.onclose = () => console.log (`client: websocket closed!`)

socket.onerror = e => console.dir (e)

socket.onmessage = e => {
   const msg = JSON.parse (e.data)

   const manage_incoming = {

      id: () => {
         id = msg.content
         console.log (`id is ${ id }`)
      },

      add_square: () => {
         console.log (`adding a square!`)
         squares.push (msg.content)
      }
   }

   manage_incoming[msg.method] ()
}

document.body.style.margin   = 0
document.body.style.overflow = `hidden`

const cnv = document.createElement (`canvas`)
cnv.width  = innerWidth
cnv.height = innerHeight

document.body.appendChild (cnv)

cnv.onpointerdown = e => {

   const msg = {
      method: `click_location`,
      content: { 
         x: e.x / cnv.width,
         y: e.y / cnv.height,
      }
   }

   socket.send (JSON.stringify (msg))   

   is_drawing = true
}

cnv.onpointerup = e => {
   is_drawing = false
}

cnv.onpointermove = e => {
   if (is_drawing) {
      const msg = {
         method: `click_location`,
         content: { 
            x: e.x / cnv.width,
            y: e.y / cnv.height,
         }
      }
      socket.send (JSON.stringify (msg))   
   }
}

const ctx = cnv.getContext (`2d`)

draw_frame ()

function draw_frame () {
   ctx.fillStyle = `turquoise`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   squares.forEach (s => {
      ctx.fillStyle = `deeppink`
      const x = s.x * cnv.width  - 10
      const y = s.y * cnv.height - 10
      ctx.fillRect (x, y, 20, 20)
   })

   requestAnimationFrame (draw_frame)
}

