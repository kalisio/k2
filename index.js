#!/usr/bin/env node

var path = require('path')
var cors = require('cors')
var express = require('express')
var MBTiles = require('@mapbox/mbtiles')
const compression = require('compression')
const { elevation } = require('./elevation')

const port = process.env.PORT || 8080
const terrainFile = process.env.TERRAIN_FILEPATH || path.join('/mbtiles', 'terrain.mbtiles')
const demFile = process.env.DEM_FILEPATH || path.join('/mbtiles', 'dem.vrt')

var app = express()
app.use(cors()) // add CORS headers -- required
app.use(compression())
app.use(express.json())

new MBTiles(terrainFile, (err, mbtiles) => {
  // if (err) {
  //   console.log(err)
  //   process.exit(1)
  //   return
  // }
  // Serve individual tiles
  app.get('/:z/:x/:y.terrain', (req, res) => {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function(err, data) {
      if (err) return res.status(404).send(err)
      res.set('Cache-Control', 'no-transform') // no compression for this
      res.set('Content-Type', 'application/vnd.quantized-mesh')
      res.set('Content-Encoding', 'gzip') // the tiles are gzipped inside mbtiles
      res.send(data)
    })
  })
  // Serve metadata
  app.get('/layer.json', (req, res) => {
    mbtiles.getInfo((err, data) => {
      res.set('Content-Type', 'application/json')
      data['tiles'] = ['{z}/{x}/{y}.terrain'] // add valid "tiles" URLs
      data['format'] = 'quantized-mesh-1.0'
      res.send(data)
    })
  })
  // Healthcheck
  app.get('/healthcheck', (req, res) => {
    res.set('Content-Type', 'application/json')
    return res.status(200).json({ isRunning: true })
  })

  app.get('/elevationat', (req, res) => {
    return res.status(200).json({ foo: false })
  })

  app.post('/elevation', async (req, res) => {
    const result = await elevation(req.body, demFile, req.query.resolution)
    return res.status(200).json(result)
  })

  // Start the server
  app.listen(port, () => {
    console.log('K2 terrain server listening at %d', port)
  })
})
