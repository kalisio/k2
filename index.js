#!/usr/bin/env node

var path = require('path')
var cors = require('cors')
var express = require('express')
var MBTiles = require('@mapbox/mbtiles')
const compression = require('compression')
const { elevation } = require('./src/elevation')
const { validateGeoJson } = require('./src/utils.geojson.js')

const port = process.env.PORT || 8080
const bodyLimit = process.env.BODY_LIMIT || '100kb'
const terrainFile = process.env.TERRAIN_FILEPATH || path.join('/mbtiles', 'terrain.mbtiles')

// features validator middleware
const geoJsonValidator = function (req, res, next) {
  if (req.body.type === 'FeatureCollection' || req.body.type === 'Feature') {
    const errors = validateGeoJson(req.body)
    if (errors.length > 0) res.status(422).json({ message: 'Invdalid \"GeoJSON\"', errors })
    else next()
  } else {
    next()
  }
}

var app = express()
app.use(cors()) // enable cors
app.use(express.urlencoded({ limit: bodyLimit, extended: true }))
app.use(express.json({ limit: bodyLimit }))
app.use(compression())

new MBTiles(terrainFile, (err, mbtiles) => {

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
      data['scheme'] = 'tms'
      res.send(data)
    })
  })

  // Elevation
  app.post('/elevation', [geoJsonValidator], async (req, res) => {
    let start = new Date()
    const result = await elevation(req.body, req.query)
    let duration = new Date() - start
    console.log('<> profile computed in %dms', duration)
    return res.status(200).json(result)
  })

  // Healthcheck
  app.get('/healthcheck', (req, res) => {
    res.set('Content-Type', 'application/json')
    return res.status(200).json({ isRunning: true })
  })  

  // Start the server
  app.listen(port, () => {
    console.log('[K2] server listening at %d (body limit %s)', port, bodyLimit)
  })
})
