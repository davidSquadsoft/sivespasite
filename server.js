//inicializamos las librerias
//------------------------------------
//------------------------------------
//:::
const { DateTime } = require("luxon");
var moment = require('moment');  
const bcryptjs = require('bcryptjs')
const express = require('express')
const bodyparser = require('body-parser')
const session = require('express-session')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const router = require('./router')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const fileupload= require('express-fileupload');
const { setMaxListeners } = require("process");
const q = require('./database/querys');
const { getFips } = require("crypto");




dotenv.config({ path: './env/.env' })

//inicializamos todas las funciones de express/bodyparser/control de session
//-----------------------------------------------------------------
//-----------------------------------------------------------------
//:::

const app = express()
app.use(bodyparser.json())
app.use(fileupload());
app.use(express.json())
app.use(bodyparser.urlencoded({ extended: true }))
app.use(cookieParser())

//static para definir rutas de los archivos de publicos
//--------------------------------------------------- -
//----------------------------------------------------
//:::
app.use(express.static(__dirname + '/public'))

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  }),
)

//Definicion del motor de backend con express y archivos EJS para cada una de las pantallas, "renderizadas" desde el servidor
//--------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------
//:::
app.set('view engine', 'ejs')
//Definicion del puerto para las pruebas
//-----------------------------
//-----------------------------
//:::
const PORT = process.env.PORT || 3000

//ruta de landing page
//--------------------
//--------------------
//:::
app.get('/', async(req, res) => {
    res.render('index', { tittle: 'Sivespa' })
})
// inicio de rutas de ciudadano
//-----------------------------
//-----------------------------
//:::
app.get('/lc/acerca', (req, res) => {
  res.render('lc/acerca', { tittle: 'Acerca' })
})
app.get('/lc/contacto', async(req, res) => {
  lineas=await q(`SELECT * FROM lineas_atention WHERE COD_PRE=0 AND COD_MUN=0`)
  res.render('lc/contacto', { tittle: 'Contacto',lineas:lineas })
})
app.get('/lc/descargas', (req, res) => {
  res.render('lc/descargas', { tittle: 'Descargas' })
})
app.get('/lc/faq', (req, res) => {
  res.render('lc/faq', { tittle: 'Faq' })
})
app.post('/lc/guia', async(req, res) => {
  muni=req.body.muni
  sexo=req.body.sexo
  eps=req.body.eps
  spa=req.body.spa
  
  planes=await q(`SELECT * FROM oferta_inst WHERE cod_mun=${muni} AND spa=${spa}`)
  lineas=await q(`SELECT * FROM lineas_atention WHERE COD_MUN=${muni} AND id_rl_lista_spa=${spa}`)
  tips=await q(`SELECT * FROM contenido WHERE tipo_con=2 AND spa=${spa} AND dirimuni=${muni} AND dirigidociu=1`)
  
  gplanes=await q(`SELECT * FROM oferta_inst WHERE cod_mun=0 AND spa=${spa}`)
  glineas=await q(`SELECT * FROM lineas_atention WHERE COD_MUN=0 AND id_rl_lista_spa=${spa}`)
  gtips=await q(`SELECT * FROM contenido WHERE tipo_con=2 AND spa=${spa} AND dirigidociu=1 AND dirimuni!=${muni}`)




  res.render('lc/guia', { tittle: 'Guia',
  planes:planes,
  lineas:lineas,
  tips:tips,
  gplanes:gplanes,
  glineas:glineas,
  gtips:gtips })
})

app.get('/lc/oferta/:idn',async(req,res)=>{
  id=req.params.idn
  oferta=await q(`SELECT * FROM oferta_inst WHERE id=${id}`)

  res.render('lc/veroferta', {tittle:oferta.titulo,oferta:oferta[0]})

})
app.get('/lc/mitos', (req, res) => {
  res.render('lc/mitos', { tittle: 'Mitos y Realidades' })
})

app.get('/lc/noticias', async(req, res) => {
  noticias=await q(`SELECT * FROM contenido WHERE tipo_con=1`)
  
  res.render('lc/noticias', { tittle: 'Noticias', noticias:noticias })
})

app.get('/lc/vernoticia/:idn', async(req, res) => {
  idn=req.params.idn

  noticias=await q(`SELECT * FROM contenido WHERE id=${idn}`)
  res.render('lc/vernoticia', { tittle: noticias[0].titulo,noticias:noticias[0] })
})

app.post('/lc/buscarnoticia', async(req,res)=>{
  kbuscar=req.body.kbuscar
  
  busqueda= await q(`SELECT * FROM contenido WHERE CONCAT(titulo,texto,NOMMUNI,NOMSPA) LIKE "%${kbuscar}%" AND tipo_con=1`)


  res.render('lc/noticias', { tittle: 'Noticias', noticias:busqueda })
})


app.get('/lc/politica_privacidad', (req, res) => {
  res.render('lc/politica_privacidad', {
    tittle: 'Politica de Privacidad y Datos',
  })
})
app.get('/lc/reporte_mayor', (req, res) => {
  res.render('lc/reporte_mayor', { tittle: 'Auto reporte de tamizaje ASSIST' })
})
app.get('/lc/reporte_menor', async(req, res) => {
  muni=await q(`SELECT DISTINCT CODMUNIC,NOMMUNIPIO FROM rl_divipola WHERE CODMUNIC!=0`)
  sexo=await q(`SELECT * FROM rl_sexo`)
  eps=await q("SELECT * FROM rl_pre_ser_sal")
  spa=await q("SELECT * FROM rl_lista_spa")

  res.render('lc/reporte_menor', {
    tittle: 'Planes de acción y líneas de atención',
    muni: muni,
    sexo: sexo,
    eps: eps,
    spa: spa
  })
})
app.get('/lc/tips', async(req, res) => {

  tips=await q(`SELECT * FROM contenido WHERE tipo_con=2`)

  res.render('lc/tips', { tittle: 'Tips', tips:tips })
})

app.post('/lc/buscartip', async(req, res) => {
  kbuscar=req.body.kbuscar
  
  busqueda= await q(`SELECT * FROM contenido WHERE CONCAT(titulo,texto,NOMMUNI,NOMSPA) LIKE "%${kbuscar}%" AND tipo_con=2`)
  res.render('lc/tips', { tittle: 'Tips', tips:busqueda })
})

app.get('/lc/vertips/:idnn', async(req, res) => {
  idnn=req.params.idnn
  tips=await q(`SELECT * FROM contenido WHERE tipo_con=2 AND id=${idnn}`)
  res.render('lc/vertip', { tittle: tips[0].titulo, tips:tips[0] })
})


app.get('/lc/tutoriales', (req, res) => {
  res.render('lc/tutoriales', { tittle: 'Tutoriales' })
})

// inicio de rutas de admin/entidades/Uentidad
//--------------------------------------------
//--------------------------------------------
//::: estan en router.js
app.use('/da', router)

// Redirigimos a pagina de error 404 en caso de que la ruta no exista
//--------------------------------------------
//--------------------------------------------
//:::
app.get('*', (req, res) => {
   res.status(404).render('error.ejs', { tittle: 'Pagina no existente' })
 })

// Arrancamos el servidor de nodejs SIVESPA
//--------------------------------------------
//--------------------------------------------
//:::
app.listen(PORT, () => {
  console.log('server starter on HTTP://LOCALHOST:3000')
})





